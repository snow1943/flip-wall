# Flip Wall 架构评估（基于 V12）

## 当前问题（V12）
- 单文件 `index_v12.html` 超过 3,600 行，样式、配置、渲染、交互、音频逻辑全部耦合在同一作用域。
- 大型静态配置（配色模板、春晚布局、像素字库）与运行时逻辑混杂，修改风险高，review 成本高。
- 新功能（如自动扩展行列、中文单字栅格化）已经增加了渲染链路复杂度，继续叠加会加速失控。

## 候选方案对比

| 方案 | 性能 | 维护性 | 迁移成本 | 适配当前 Three.js 实现 |
| --- | --- | --- | --- | --- |
| 保持单 HTML | 高 | 低 | 低 | 高 |
| **模块化 Vanilla JS（本次落地）** | **高** | **中高** | **中低** | **高** |
| React + Three.js（UI React, 渲染仍 imperative） | 中高 | 高 | 中高 | 中高 |
| React Three Fiber 全量改造 | 中 | 中高 | 高 | 中 |

## 推荐结论
- 现阶段优先选择：**模块化 Vanilla JS**。
- 原因：
  - 你的核心性能瓶颈在 WebGL 渲染和几何/材质更新，不在 DOM diff。
  - 现在直接上 React 全量改造，短期会引入大量迁移噪音，且容易影响既有动画与拾取逻辑。
  - 模块化拆分可以先把复杂度压住，再决定是否把 GUI/业务面板迁到 React。

## 本次 V13 重构范围
- 不改动 `V12` 文件。
- 新建 `v13_refactor/`：
  - 页面入口：`index.html`
  - 样式：`styles/main.css`
  - 主逻辑：`src/main.js`
  - 设置面板：`src/ui/settingsPanel.js`
  - 配置模块：
    - `src/config/colorPresets.js`
    - `src/config/springLayout.js`
    - `src/config/pixelFont.js`
- 已保留你在 V12 最新修复的关键逻辑：
  - `ensureDisplayGridCapacity(...)` 自动扩展行列链路
  - 预览/播放接入扩墙
  - 中文“单字栅格化 -> 点阵拼接”流程

## 下一步建议（可选）
1. 把 `src/main.js` 再拆为 `engine/`, `text/`, `audio/`, `ui/` 四层。
2. 先把控制面板（非 WebGL 核心）迁到 React，再决定是否引入状态库（如 Zustand）。
3. 增加基础回归：文本渲染、扩墙、春晚布局、音乐驱动四项 smoke test。
