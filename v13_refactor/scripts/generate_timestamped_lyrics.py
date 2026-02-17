#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
import re
import shutil
import subprocess
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import List, Dict, Tuple, Optional

import whisper


TITLE_RE = re.compile(r"^#{0,4}\s*《\s*([^》]+)\s*》")
TIMED_LINE_RE = re.compile(r"^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.+)$")


def sanitize_line(line: str) -> str:
    return re.sub(r"\s+", " ", line.strip())


def is_meta_line(line: str) -> bool:
    compact = re.sub(r"\s+", "", line)
    if not compact:
        return True
    if compact.endswith("门票") or compact.endswith("歌词"):
        return True
    if re.match(r"^(演唱|作词|作曲|词曲|编曲|制作人|监制|和声编写|和声录音|和声|混音师|母带工程师|录音师|吉他录音|人声录音棚|录音棚|钢琴|吉他|鼓|管乐|贝斯|弦乐)[：:]", compact):
        return True
    if re.match(r"^(词|曲)[：:]", compact):
        return True
    if re.search(r"[A-Za-z@]", compact) and re.search(r"studio|mastering|sync|record", compact, re.I):
        return True
    return False


def normalize_for_match(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^\u4e00-\u9fff0-9a-zA-Z]", "", text)
    return text


@dataclass
class Section:
    title: str
    lines: List[str]


@dataclass
class Anchor:
    line_idx: int
    seg_idx: int
    score: float


def parse_sections(markdown: str) -> List[Section]:
    sections: List[Section] = []
    title = ""
    lines: List[str] = []

    def flush() -> None:
        nonlocal title, lines
        if title and lines:
            sections.append(Section(title=title, lines=lines[:]))
        title = ""
        lines = []

    for raw in markdown.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = TITLE_RE.match(line)
        if m:
            flush()
            title = m.group(1).strip()
            continue
        if not title:
            continue
        if TIMED_LINE_RE.match(line):
            text = TIMED_LINE_RE.match(line).group(4).strip()  # type: ignore[union-attr]
            if text:
                lines.append(text)
            continue
        if is_meta_line(line):
            continue
        clean = sanitize_line(re.sub(r"^[\-*•]+\s*", "", line))
        if clean:
            lines.append(clean)

    flush()
    return sections


def find_audio_for_title(music_dir: Path, title: str) -> Optional[Path]:
    candidates = [title, f"《{title}》"]
    exts = [".mp3", ".m4a", ".wav", ".flac", ".aac", ".ogg", ".opus", ".MP3", ".M4A"]
    for name in candidates:
        for ext in exts:
            p = music_dir / f"{name}{ext}"
            if p.exists():
                return p
    for p in music_dir.iterdir():
        if not p.is_file():
            continue
        if p.suffix.lower() not in {".mp3", ".m4a", ".wav", ".flac", ".aac", ".ogg", ".opus"}:
            continue
        stem = p.stem
        if title in stem or stem in title:
            return p
    return None


def get_duration_seconds(audio_path: Path) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(audio_path)
    ]
    try:
        out = subprocess.check_output(cmd, text=True).strip()
        value = float(out)
        return value if math.isfinite(value) and value > 0 else 0.0
    except Exception:
        return 0.0


def segment_similarity(line: str, seg: str) -> float:
    a = normalize_for_match(line)
    b = normalize_for_match(seg)
    if not a or not b:
        return 0.0
    if a in b or b in a:
        short = min(len(a), len(b))
        long = max(len(a), len(b))
        return 0.68 + 0.32 * (short / max(1, long))
    ratio = SequenceMatcher(None, a, b).ratio()
    inter = len(set(a) & set(b))
    cover = inter / max(1, len(set(a)))
    return max(ratio, cover * 0.92)


def best_anchors(lines: List[str], segments: List[dict], score_threshold: float = 0.26) -> List[Anchor]:
    if not lines or not segments:
        return []

    raw: List[Anchor] = []
    seg_texts = [str(s.get("text", "")).strip() for s in segments]
    for i, line in enumerate(lines):
        best_j = -1
        best_score = 0.0
        for j, seg_text in enumerate(seg_texts):
            score = segment_similarity(line, seg_text)
            if score > best_score:
                best_score = score
                best_j = j
        if best_j >= 0 and best_score >= score_threshold:
            raw.append(Anchor(line_idx=i, seg_idx=best_j, score=best_score))

    if not raw:
        return []

    # Weighted LIS on seg_idx to ensure monotonic alignment.
    n = len(raw)
    dp = [0.0] * n
    prev = [-1] * n
    for i in range(n):
        dp[i] = raw[i].score
        for j in range(i):
            if raw[j].line_idx < raw[i].line_idx and raw[j].seg_idx < raw[i].seg_idx:
                cand = dp[j] + raw[i].score
                if cand > dp[i]:
                    dp[i] = cand
                    prev[i] = j

    end = max(range(n), key=lambda k: dp[k])
    chain: List[Anchor] = []
    while end >= 0:
        chain.append(raw[end])
        end = prev[end]
    chain.reverse()

    # Keep stronger anchors only when too dense.
    filtered: List[Anchor] = []
    for item in chain:
        if not filtered:
            filtered.append(item)
            continue
        last = filtered[-1]
        if item.line_idx == last.line_idx:
            if item.score > last.score:
                filtered[-1] = item
            continue
        if item.seg_idx == last.seg_idx:
            if item.score > last.score:
                filtered[-1] = item
            continue
        filtered.append(item)
    return filtered


def line_weight(line: str) -> float:
    text = sanitize_line(line)
    chars = len(re.sub(r"\s+", "", text))
    punct = len(re.findall(r"[，,。！？!?；;：:、]", text))
    return 1.0 + chars * 0.56 + punct * 0.52


def minimum_line_gap(line: str) -> float:
    text = sanitize_line(line)
    chars = len(re.sub(r"\s+", "", text))
    return max(0.16, min(0.42, 0.14 + min(chars, 20) * 0.015))


def distribute_block_times(lines: List[str], start_idx: int, end_idx: int, start_t: float, end_t: float, out: List[float]) -> None:
    if end_idx < start_idx:
        return
    count = end_idx - start_idx + 1
    if count == 1:
        out[start_idx] = max(out[start_idx], start_t)
        return
    span = max(0.22 * (count - 1), end_t - start_t)
    weights = [line_weight(lines[i]) for i in range(start_idx, end_idx + 1)]
    total = sum(weights)
    cursor = start_t
    for offset, idx in enumerate(range(start_idx, end_idx + 1)):
        out[idx] = max(out[idx], cursor)
        if offset == count - 1:
            break
        step = span * (weights[offset] / max(1e-6, total))
        cursor += step


def align_lines_with_segments(lines: List[str], segments: List[dict], duration: float) -> List[Tuple[float, str]]:
    n = len(lines)
    if n == 0:
        return []
    if duration <= 0:
        duration = max(25.0, n * 2.2)

    anchors = best_anchors(lines, segments)
    starts = [0.0 for _ in range(n)]

    seg_starts = [float(s.get("start", 0.0) or 0.0) for s in segments] if segments else []
    first_voice = max(0.0, (seg_starts[0] - 0.35)) if seg_starts else 0.0
    tail_guard = max(first_voice + 1.0, duration - 0.35)

    if not anchors:
        distribute_block_times(lines, 0, n - 1, first_voice, tail_guard, starts)
    else:
        for a in anchors:
            starts[a.line_idx] = max(0.0, float(segments[a.seg_idx].get("start", 0.0) or 0.0))

        # head block
        first_anchor = anchors[0]
        if first_anchor.line_idx > 0:
            distribute_block_times(
                lines,
                0,
                first_anchor.line_idx - 1,
                first_voice,
                max(first_voice + 0.2, starts[first_anchor.line_idx] - 0.1),
                starts,
            )

        # middle blocks
        for left, right in zip(anchors, anchors[1:]):
            left_t = starts[left.line_idx]
            right_t = starts[right.line_idx]
            if right.line_idx - left.line_idx > 1:
                distribute_block_times(
                    lines,
                    left.line_idx + 1,
                    right.line_idx - 1,
                    left_t + 0.18,
                    max(left_t + 0.28, right_t - 0.12),
                    starts,
                )

        # tail block
        last_anchor = anchors[-1]
        if last_anchor.line_idx < n - 1:
            distribute_block_times(
                lines,
                last_anchor.line_idx + 1,
                n - 1,
                starts[last_anchor.line_idx] + 0.18,
                tail_guard,
                starts,
            )

    # enforce monotonic increasing starts
    starts[0] = max(0.0, starts[0])
    for i in range(1, n):
        starts[i] = max(starts[i], starts[i - 1] + minimum_line_gap(lines[i - 1]))

    max_start = max(0.0, duration - 0.2)
    for i in range(n):
        starts[i] = min(starts[i], max_start)

    return list(zip(starts, lines))


def format_timestamp(seconds: float) -> str:
    seconds = max(0.0, float(seconds))
    total_cs = int(round(seconds * 100))
    mm = total_cs // 6000
    ss = (total_cs % 6000) // 100
    cs = total_cs % 100
    return f"{mm:02d}:{ss:02d}.{cs:02d}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate timestamped lyrics markdown from local Whisper transcription.")
    parser.add_argument("--project-root", default=".", help="Project root that contains v13_refactor/music")
    parser.add_argument("--model", default="medium", help="Whisper model name")
    parser.add_argument("--language", default="zh", help="Language hint for Whisper")
    args = parser.parse_args()

    root = Path(args.project_root).resolve()
    music_dir = root / "v13_refactor" / "music"
    lyrics_path = music_dir / "歌词.md"
    backup_path = music_dir / "歌词.original.md"

    if not lyrics_path.exists():
        raise FileNotFoundError(f"lyrics file not found: {lyrics_path}")

    source_md = lyrics_path.read_text(encoding="utf-8")
    sections = parse_sections(source_md)
    if not sections:
        raise RuntimeError("No lyric sections found in lyrics.md")

    if not backup_path.exists():
        shutil.copy2(lyrics_path, backup_path)
        print(f"[backup] {backup_path}")

    print(f"[model] loading whisper model: {args.model}")
    model = whisper.load_model(args.model)

    rendered: List[str] = []
    for idx, section in enumerate(sections, start=1):
        title = section.title
        audio_path = find_audio_for_title(music_dir, title)
        print(f"[{idx}/{len(sections)}] {title}")

        rendered.append(f"《{title}》")
        rendered.append("")

        if audio_path is None:
            print("  - audio: not found, fallback to uniform timing")
            duration = max(25.0, len(section.lines) * 2.2)
            aligned = align_lines_with_segments(section.lines, [], duration)
        else:
            print(f"  - audio: {audio_path.name}")
            duration = get_duration_seconds(audio_path)
            result = model.transcribe(
                str(audio_path),
                language=args.language,
                task="transcribe",
                fp16=False,
                temperature=0,
                condition_on_previous_text=False,
                verbose=False,
            )
            segments = result.get("segments", []) or []
            print(f"  - segments: {len(segments)}")
            aligned = align_lines_with_segments(section.lines, segments, duration)

        for ts, line in aligned:
            rendered.append(f"[{format_timestamp(ts)}] {line}")
        rendered.append("")

    output = "\n".join(rendered).rstrip() + "\n"
    lyrics_path.write_text(output, encoding="utf-8")
    print(f"[done] wrote timestamped lyrics: {lyrics_path}")


if __name__ == "__main__":
    main()
