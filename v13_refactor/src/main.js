let scene, camera, renderer, raycaster, mouse, controls;
let spotLight, fillLight, rimLight, backLight;
let sweepLights = [];
let isCameraInteracting = false;
const pixels = []; // Stores the prism groups
const DEFAULT_ROWS = 12;
const DEFAULT_COLS = 22;
const DEFAULT_GAP = 0.057;

// 默认：金属灰 + 翻转金色。高光条避免纯白，防止面片被冲成白块
const BASE_MATERIAL_PARAMS = {
    roughness: 0.11,
    metalness: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 4.2
};

const BASE_FACE_COLOR_PARAMS = {
    globalSeparation: 1.28,

    color1: '#98a3b3',
    hueShift1: -0.015,
    saturation1: 0.55,
    lightness1: 1.05,

    color2: '#6f7b8a',
    hueShift2: -0.01,
    saturation2: 0.62,
    lightness2: 0.86,

    color3: '#d5a85c',
    hueShift3: 0.01,
    saturation3: 1.26,
    lightness3: 0.95
};

const BASE_ENV_PARAMS = {
    bgTop: '#151518',
    bgMid: '#10161f',
    bgBottom: '#1d232e',

    strip1X: 80,
    strip1Width: 100,
    strip1Alpha: 0.56,
    strip1Top: '#c6cfdb',
    strip1Bottom: '#7f8da2',

    strip2X: 320,
    strip2Width: 120,
    strip2Alpha: 0.48,
    strip2Top: '#b4c0d0',
    strip2Bottom: '#6f7e93',

    strip3X: 640,
    strip3Width: 130,
    strip3Alpha: 0.42,
    strip3Top: '#b4a483',
    strip3Bottom: '#776846',

    block1Enabled: true,
    block1X: 240,
    block1Y: 278,
    block1Width: 340,
    block1Height: 86,
    block1Start: '#6d7fa8',
    block1End: '#435270',
    block1Alpha: 0.16,

    block2Enabled: true,
    block2X: 96,
    block2Y: 118,
    block2Width: 220,
    block2Height: 58,
    block2Start: '#98a7bd',
    block2End: '#606b7e',
    block2Alpha: 0.1,

    sparkleCount: 14,
    sparkleSize: 5,
    sparkleAlpha: 0.32
};

const materialParams = { ...BASE_MATERIAL_PARAMS };
const faceColorParams = { ...BASE_FACE_COLOR_PARAMS };
const envParams = { ...BASE_ENV_PARAMS };

const configNamespace = window.FlipWallConfig || {};
const DEFAULT_COLOR_PRESETS = configNamespace.DEFAULT_COLOR_PRESETS || {};
const SPRING_GALA_LAYOUT_COLS = configNamespace.SPRING_GALA_LAYOUT_COLS || 52;
const SPRING_GALA_LAYOUT_ROWS = configNamespace.SPRING_GALA_LAYOUT_ROWS || 40;
const SPRING_GALA_ROW_SEGMENTS = configNamespace.SPRING_GALA_ROW_SEGMENTS || [];
const FONT_HEIGHT = configNamespace.FONT_HEIGHT || 7;
const FONT_SPACING = configNamespace.FONT_SPACING || 1;
const PIXEL_FONT = configNamespace.PIXEL_FONT || {};

const presetState = {
    theme: '春节纯洁红'
};

const PRESET_STORAGE_KEY = 'flip_wall_v13_presets';
const MUSIC_COLOR_PRESET_PRIORITY = ['春节纯洁红', '翡翠鎏金', '暮色玫瑰铜', '钛蓝冷光'];
const DISALLOWED_GRAY_THEME_PATTERN = /(金属灰|灰色金属|墨黑铬面|chrome|metal\s*gray|grey|silver|黑白|灰)/i;
const WAVE_EFFECTS = ['效果1-行波', '效果2-行内波', '效果3-扫光', '效果4-双轨流色', '效果5-柱形均衡波', '效果6-矩形闪烁块'];
const DUAL_TRACK_FLOW_MODE_FLIP = '翻转流动';
const DUAL_TRACK_FLOW_MODE_COLOR_ONLY = '颜色流动(不翻转)';
const AUTO_EFFECT_RECENT_WINDOW = 8;
const AUTO_EFFECT_TARGET_SHARE = {
    '效果1-行波': 0.16,
    '效果2-行内波': 0.22,
    '效果3-扫光': 0.2,
    '效果4-双轨流色': 0.21,
    '效果5-柱形均衡波': 0.21
};
const PRESET_MUSIC_LIBRARY = [
    { label: '立春', file: './music/立春.m4a' },
    { label: '人间共鸣', file: './music/人间共鸣.mp3' },
    { label: '你我经历的一刻', file: './music/你我经历的一刻.mp3' },
    { label: '吉量', file: './music/吉量.mp3' },
    { label: '妈妈有座电影院', file: './music/妈妈有座电影院.mp3' },
    { label: '闪耀动起来', file: './music/闪耀动起来.mp3' },
    { label: '驭风歌', file: './music/驭风歌.mp3' },
    { label: '轻快电子 140', file: './music/140bpm_Upbeat-electronic-intro.mp3' },
    { label: '希望背景 128', file: './music/128bpm_Hopeful-background.mp3' },
    { label: '优雅钢琴 120', file: './music/120bpm_Elegant-piano.mp3' },
    { label: '八音盒 110', file: './music/110bpm_Music-box.mp3' },
    { label: '抒情钢琴 90', file: './music/90bpm_Melancholy-piano-music.mp3' }
];
const LYRICS_MARKDOWN_PATHS = [
    './music/歌词.md',
    './music/%E6%AD%8C%E8%AF%8D.md',
    './music/歌词.original.md',
    './music/%E6%AD%8C%E8%AF%8D.original.md'
];
const LYRIC_ANIMATION_CLASSES = ['lyric-anim-rise', 'lyric-anim-slide', 'lyric-anim-bloom', 'lyric-anim-impact'];
const LYRIC_TRACK_ALIASES = {
    '立春春晚2026': '立春',
    '立春2026': '立春'
};

const sceneModeConfig = {
    mode: '春晚模式',
    springAutoResize: true,
    springRows: 48,
    springCols: 64,
    strokePixels: 1
};

const displayConfig = {
    sequence: '2|1|HELLO|WORLD|你好|新年快乐',
    intervalMs: 1200,
    onFace: 2,
    threshold: 120,
    textScale: 0.78,
    bold: true,
    compactCols: 10,
    autoExpand: true,
    autoExpandMaxRows: 120,
    autoExpandMaxCols: 240,
    loop: true,
    cjkTargetRows: 12,     // 设为 12 像素 (Zpix 原生字号) 以获得最佳点阵效果
    cjkWidthEstimate: 12,  // 12px 字体全宽
    cjkGapCells: 1,
    cjkAdvanceRatio: 1.0,  // 像素字体通常是等宽或接近全宽
    cjkTrackingRatio: 0.0, // 像素字体不需要额外间距
    cjkEdgeThreshold: 128, // 标准阈值
    cjkFillRatio: 0.30,    // 较高的填充阈值，因为像素字体是实心的
    cjkThinPasses: 0       // 像素字体自带细笔画，无需骨架化
};

const playbackState = {
    running: false,
    runId: 0,
    lastText: ''
};

const springWaveConfig = {
    effect: '效果1-行波',
    direction: '从上到下',
    rowIntervalMs: 130,
    stagePauseMs: 90,
    innerDelayMs: 14,
    innerDirection: '从左到右',
    damping: 0.11,
    musicSyncAllEffects: true,
    musicSyncMode: '节拍优先',
    musicSyncStrength: 0.86,
    musicSyncMinMs: 26,
    musicSyncMaxMs: 420,
    musicSyncBeatPulse: 0.28,
    outerFace: 1,
    innerBaseFace: 2,
    innerFlowFace: 1,
    flowRenderMode: DUAL_TRACK_FLOW_MODE_FLIP,
    outerTrackColor: '#d84d2e',
    innerBaseColor: '#3b0f1c',
    innerFlowColor: '#ffb347',
    flowDirection: '正向',
    flowStepMs: 90,
    flowCycles: 3,
    flowBandSize: 1,
    equalizerDrive: '随机波动',
    equalizerBars: 28,
    equalizerAreaRatio: 0.78,
    equalizerUpdateMs: 120,
    equalizerSmoothing: 0.55,
    equalizerAttack: 0.72,
    equalizerDecay: 0.085,
    equalizerMinRatio: 0.06,
    equalizerMaxRatio: 1.0,
    equalizerRandomness: 0.08,
    equalizerAudioGain: 1.35,
    equalizerFluxGain: 2.2,
    equalizerSpectrumBalance: 1.0,
    equalizerBodyMotion: 0.34,
    equalizerTempoSync: '节拍优先',
    equalizerSyncStrength: 0.88,
    equalizerSyncMinMs: 34,
    equalizerSyncMaxMs: 210,
    equalizerBeatPulse: 0.28,
    equalizerResetOnStart: true,
    mosaicFaceA: 1,
    mosaicFaceB: 2,
    mosaicMinLen: 2,
    mosaicMaxLen: 11,
    mosaicHorizontalBias: 0.58,
    mosaicActivationRate: 0.34,
    mosaicDecayRate: 0.26,
    mosaicSwapRate: 0.12,
    mosaicContrastBias: 0.52,
    mosaicUpdateMs: 110,
    mosaicRebuildMs: 2800,
    mosaicResetOnStart: true,
    mosaicTempoSync: '节拍优先',
    mosaicSyncStrength: 0.82,
    mosaicSyncMinMs: 76,
    mosaicSyncMaxMs: 360
};

const sweepLightConfig = {
    color: '#ffe3a6',
    intensity: 6.2,
    angle: 0.98,
    penumbra: 0.92,
    distance: 170,
    z: 24,
    durationMs: 2600,
    overscan: 0.24,
    xOffset: 0,
    count: 5,
    spanScale: 1.08,
    edgeAttenuation: 0.25
};

const springWaveState = {
    running: false,
    runId: 0
};

const musicDriveConfig = {
    sourceUrl: '',
    autoPlayAfterLoad: false,
    sourceLoop: true,
    autoTrigger: true,
    smoothing: 0.72,
    gainBoost: 1.6,
    beatThreshold: 0.3,
    beatFluxThreshold: 0.02,
    beatCooldownMs: 170,
    triggerIntervalMs: 260,
    minRowIntervalMs: 30,
    maxRowIntervalMs: 280,
    minDamping: 0.07,
    maxDamping: 0.22
};

const musicDriveState = {
    audioEl: null,
    audioContext: null,
    sourceNode: null,
    analyser: null,
    timeData: null,
    freqData: null,
    graphConnected: false,
    running: false,
    smoothedEnergy: 0,
    lowBand: 0,
    midBand: 0,
    highBand: 0,
    energyFlux: 0,
    lastBeatAt: 0,
    strongBeatAt: 0,
    strongBeatStrength: 0,
    prevBeatAt: 0,
    beatIntervalMs: 0,
    smoothedBeatIntervalMs: 0,
    lastTriggerAt: 0,
    lastUiAt: 0,
    objectUrl: ''
};

const musicDriveUi = {
    status: '音乐驱动：未加载音源'
};

const panelState = {
    visible: false
};

const guiRefs = {
    playbackFolder: null,
    springWaveFolder: null,
    musicFolder: null,
    lyricFolder: null
};

const experienceState = {
    trackName: '',
    active: false,
    autoOrchestration: false,
    currentEffect: '',
    nextEffectSwitchAt: 0,
    effectHistory: [],
    colorHistory: [],
    startedAt: 0,
    cameraAnchorYaw: 0,
    cameraYawLimit: 0.72,
    cameraOrbitDirection: 1,
    cameraMoveMode: 'arc',
    cameraModeSwitchAt: 0,
    cameraMoveCycle: 0,
    cameraKickStyle: 'smooth',
    cameraKickEnvelope: 0,
    cameraStutterUntil: 0,
    cameraLastStrongBeatAt: 0,
    flashBurstUntil: 0,
    flashCooldownUntil: 0,
    colorPresetPool: [],
    nextColorShiftAt: 0,
    lastColorShiftAt: 0,
    cameraPose: {
        yaw: 0,
        radius: 34,
        height: 0,
        fov: 32,
        sway: 0.7,
        roll: 0
    },
    cameraTarget: {
        yaw: 0,
        radius: 34,
        height: 0,
        fov: 32,
        sway: 0.7,
        roll: 0
    }
};

const lyricState = {
    loadingPromise: null,
    loaded: false,
    library: new Map(),
    requestToken: 0,
    activeSongTitle: '',
    activeKey: '',
    lines: [],
    timeline: [],
    currentIndex: -1,
    animationCursor: 0,
    hasExplicitTimestamps: false,
    baseTimeline: [],
    usingFallbackDuration: false,
    fallbackDurationSec: 0,
    durationSec: 0,
    debugAnchorIndex: -1,
    debugSelectionLocked: false
};

const transportState = {
    ready: false,
    dragging: false,
    dragValue: 0
};

const lyricDebugConfig = {
    offsetSec: 0,
    timeScale: 1,
    nudgeStep: 0.05,
    lineDebugMode: false,
    lineSeekStepSec: 0.1,
    status: '歌词调试：未加载'
};

const PRESET_TRANSITION_MODES = {
    IMMEDIATE: 'none',
    BLEND: 'blend',
    FLIP: 'flip'
};

const PRESET_TRANSITION_CONFIG = {
    blendDurationMs: 240,
    manualFlipDelayMs: 60,
    manualFlipDampingMin: 0.13,
    manualFlipDampingMax: 0.21
};

// Constants from prism_v2.html adjustment
const UNIT_SIZE = 1.0;
const PLATE_THICKNESS = 0.001;
const BEVEL_THICKNESS = 0.001;
const CORNER_RADIUS = 0.3;
const GAP_OFFSET = 0.0;
const PLATE_SCALE = 1.0;

const innerParams = {
    size: 0.54,
    length: 0.84,
    radius: 0.05,
    bevel: 0.0,
    color: '#111111',
    x: 0,
    y: 0,
    z: 0
};

// 初始配置
const config = {
    initRotationX: Math.PI / 2, // 90度，让面完全垂直
    initRotationY: 0.0,
    initRotationZ: 0.0,
    gap: DEFAULT_GAP,
    gridRows: DEFAULT_ROWS,
    gridCols: DEFAULT_COLS,

    // 相机设置
    camX: 0, camY: 0, camZ: 46,
    camFov: 32,


    // 灯光设置 (聚光灯)
    spotLightX: 7, spotLightY: 12, spotLightZ: 28,
    spotLightIntensity: 1.8,
    spotLightAngle: Math.PI / 4, // 45度
    spotLightPenumbra: 0.5, // 边缘柔化

    fillLightX: -10, fillLightY: 3, fillLightZ: 18,
    fillLightIntensity: 0.55
};

// Shared Geometry and Material (for performance)
let plateGeometry, innerGeometry;
let materials = [];
let innerMaterial;
let guiPanel = null;
let colorPresets = {};
let generatedEnvMap = null;
let envRebuildTimer = null;
let activeMask = [];
let activeWallBounds = null;
const pixelLookup = new Map();
const edgeRimMeshes = [];
const freeSwipeState = {
    pointerDown: false,
    pointerId: null,
    lastGridKey: ''
};
const presetColorMixA = new THREE.Color();
const presetColorMixB = new THREE.Color();
const glyphBitmapCache = new Map();
const CJK_BASE_CELL_SIZE = 16;
let presetTransitionState = null;

function gridKey(row, col) {
    return `${row},${col}`;
}

function isDisplayMode() {
    return sceneModeConfig.mode === '展示模式';
}

function isFreeMode() {
    return sceneModeConfig.mode === '自由模式';
}

function isSpringFestivalMode() {
    return sceneModeConfig.mode === '春晚模式';
}

function resetFreeSwipeState() {
    freeSwipeState.pointerDown = false;
    freeSwipeState.pointerId = null;
    freeSwipeState.lastGridKey = '';
}

function updateModeHint() {
    const hint = document.getElementById('mode-hint');
    const interactionHint = document.getElementById('interaction-hint');
    if (isSpringFestivalMode()) {
        if (hint) {
            hint.textContent = '当前模式：春晚模式（按马年元素 PNG 布局 + 2 像素包边）';
        }
        if (interactionHint) {
            interactionHint.textContent = '春晚模式：行波 / 柱形均衡 / 矩形闪烁 / 扫光 / 音乐驱动';
        }
        return;
    }
    if (isFreeMode()) {
        if (hint) {
            hint.textContent = '当前模式：自由模式（仅鼠标滑动翻转）';
        }
        if (interactionHint) {
            interactionHint.textContent = '自由模式：按住左键在像素上滑动翻转';
        }
        return;
    }
    if (hint) {
        hint.textContent = '当前模式：展示模式（支持文字播放）';
    }
    if (interactionHint) {
        interactionHint.textContent = '展示模式：按序列显示数字/英文/中文';
    }
}

function refreshModeUiState() {
    if (guiRefs.playbackFolder && guiRefs.playbackFolder.domElement) {
        guiRefs.playbackFolder.domElement.style.display = isDisplayMode() ? '' : 'none';
    }
    if (guiRefs.springWaveFolder && guiRefs.springWaveFolder.domElement) {
        guiRefs.springWaveFolder.domElement.style.display = isSpringFestivalMode() ? '' : 'none';
    }
    if (guiRefs.musicFolder && guiRefs.musicFolder.domElement) {
        guiRefs.musicFolder.domElement.style.display = isSpringFestivalMode() ? '' : 'none';
    }
    if (guiRefs.lyricFolder && guiRefs.lyricFolder.domElement) {
        guiRefs.lyricFolder.domElement.style.display = isSpringFestivalMode() ? '' : 'none';
    }
    if (controls) {
        controls.enabled = !isFreeMode();
    }
    if (!isFreeMode()) {
        resetFreeSwipeState();
    }
    isCameraInteracting = false;
    updateModeHint();
}

function getSpringRecommendedGrid() {
    const moduleSize = Math.max(1, Math.floor(sceneModeConfig.strokePixels));
    const bounds = getSpringModuleBounds();
    return {
        rows: bounds.rows * moduleSize + 8,
        cols: bounds.cols * moduleSize + 12
    };
}

function getSafeCameraAspect() {
    if (camera && Number.isFinite(camera.aspect) && camera.aspect > 0) {
        return camera.aspect;
    }
    const w = Math.max(1, window.innerWidth || 1);
    const h = Math.max(1, window.innerHeight || 1);
    return w / h;
}

function computeWallFitDistance(bounds, fovDeg, padding = 1.22) {
    const safeBounds = bounds || {
        width: 16,
        height: 12
    };
    const aspect = getSafeCameraAspect();
    const clampedFov = clamp(Number(fovDeg) || config.camFov, 18, 65);
    const vFov = THREE.MathUtils.degToRad(clampedFov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const halfH = Math.max(0.8, safeBounds.height * 0.5 * padding);
    const halfW = Math.max(0.8, safeBounds.width * 0.5 * padding);
    const distV = halfH / Math.tan(vFov / 2);
    const distH = halfW / Math.tan(Math.max(0.02, hFov / 2));
    return Math.max(distV, distH);
}

function getPreferredWallCameraRadius(fovDeg) {
    const bounds = activeWallBounds || { width: 16, height: 12 };
    return computeWallFitDistance(bounds, fovDeg, 1.22) + 3.5;
}

function applyWallOverviewCamera(options = {}) {
    if (!camera || !controls) {
        return;
    }
    const bounds = activeWallBounds || {
        centerX: 0,
        centerY: 0,
        width: 16,
        height: 12
    };
    const fov = clamp(Number(options.fov) || config.camFov, 18, 65);
    const radius = getPreferredWallCameraRadius(fov);
    const yLift = clamp(bounds.height * 0.04, -0.5, 3.4);
    const x = bounds.centerX + (Number(options.xOffset) || 0);
    const y = bounds.centerY + yLift + (Number(options.yOffset) || 0);
    const z = radius + (Number(options.zOffset) || 0);
    const targetY = bounds.centerY + (Number(options.targetYOffset) || 0);

    camera.position.set(x, y, z);
    controls.target.set(bounds.centerX, targetY, 0);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    controls.update();

    config.camX = x;
    config.camY = y;
    config.camZ = z;
    config.camFov = fov;
}

function applySceneMode() {
    stopPlayback();
    stopSpringWave();
    if (!isSpringFestivalMode()) {
        stopMusicDrive({ keepSource: true, pauseAudio: true });
    }
    if (isSpringFestivalMode()) {
        if (sceneModeConfig.springAutoResize) {
            const recommended = getSpringRecommendedGrid();
            config.gridRows = Math.max(
                1,
                Math.max(
                    Math.floor(config.gridRows),
                    Math.floor(sceneModeConfig.springRows),
                    recommended.rows
                )
            );
            config.gridCols = Math.max(
                1,
                Math.max(
                    Math.floor(config.gridCols),
                    Math.floor(sceneModeConfig.springCols),
                    recommended.cols
                )
            );
        }
        playbackState.lastText = '';
    }
    refreshModeUiState();
    createPixelWall();
    if (isSpringFestivalMode() && !experienceState.active) {
        applyWallOverviewCamera({ fov: Math.min(config.camFov, 32) });
    }
    if (guiPanel) {
        updateGuiFolderDisplay(guiPanel);
    }
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101317);

    // 透视相机（更有纵深和透视感）
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(config.camFov, aspect, 0.1, 1000);
    camera.position.set(config.camX, config.camY, config.camZ);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true; // Enable shadows if needed
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.minDistance = 10;
    controls.maxDistance = 600;
    controls.target.set(0, 0, 0);
    controls.addEventListener('start', () => {
        isCameraInteracting = true;
    });
    controls.addEventListener('end', () => {
        isCameraInteracting = false;
    });

    // Lighting from prism_v2 + prism_v3 metallic tuning
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.16);
    scene.add(ambientLight);

    // 主光源：改用 SpotLight 以获得柔和边缘和圆形光照
    spotLight = new THREE.SpotLight(0xffffff, config.spotLightIntensity);
    spotLight.position.set(config.spotLightX, config.spotLightY, config.spotLightZ);
    spotLight.angle = config.spotLightAngle;
    spotLight.penumbra = config.spotLightPenumbra; // 关键：让边缘柔和
    spotLight.decay = 1.5; // 物理衰减
    spotLight.distance = 100;

    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048; // 提高阴影质量
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight);

    fillLight = new THREE.DirectionalLight(0xe3ebf8, config.fillLightIntensity);
    fillLight.position.set(config.fillLightX, config.fillLightY, config.fillLightZ);
    scene.add(fillLight);

    rimLight = new THREE.DirectionalLight(0xf7f9ff, 0.6);
    rimLight.position.set(-12, -6, 10);
    scene.add(rimLight);

    backLight = new THREE.DirectionalLight(0xdde6f7, 0.35);
    backLight.position.set(0, -5, -15);
    scene.add(backLight);

    // 效果3：多灯并列扫光（默认隐藏）
    rebuildSweepLights();
    updateSweepLightParams();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(-1, -1);
    colorPresets = loadColorPresets();

    // Pre-create geometries and materials
    initResources();
    applyPreset(presetState.theme, { transition: PRESET_TRANSITION_MODES.IMMEDIATE });
    createPixelWall();
    setupSettingsToggle();
    setupMusicFilePicker();
    setupExperienceUi();
    updateMusicHint(musicDriveUi.status);
    setPanelVisible(false);

    initGUI();
    applySceneMode();

    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerCancelOrLeave);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancelOrLeave);
    window.addEventListener('resize', onWindowResize);
    animate();
}

function clearSweepLights() {
    for (const item of sweepLights) {
        scene.remove(item.light);
        scene.remove(item.target);
    }
    sweepLights = [];
}

function rebuildSweepLights() {
    if (!scene) {
        return;
    }
    clearSweepLights();
    const count = clamp(Math.floor(sweepLightConfig.count), 1, 12);
    sweepLightConfig.count = count;
    for (let i = 0; i < count; i++) {
        const target = new THREE.Object3D();
        target.position.set(0, 0, 0);
        scene.add(target);

        const light = new THREE.SpotLight(0xffffff, 0);
        light.position.set(0, 0, sweepLightConfig.z);
        light.target = target;
        light.castShadow = false;
        light.visible = false;
        scene.add(light);

        sweepLights.push({ light, target });
    }
}

function updateSweepLightParams() {
    const expectedCount = clamp(Math.floor(sweepLightConfig.count), 1, 12);
    if (sweepLights.length !== expectedCount) {
        rebuildSweepLights();
    }
    if (!sweepLights.length) {
        return;
    }
    for (const item of sweepLights) {
        item.light.color.set(sweepLightConfig.color);
        item.light.angle = clamp(sweepLightConfig.angle, 0.25, Math.PI / 2);
        item.light.penumbra = clamp(sweepLightConfig.penumbra, 0, 1);
        item.light.distance = Math.max(20, sweepLightConfig.distance);
        item.light.decay = 1.2;
    }
}

function scheduleEnvironmentRebuild() {
    clearTimeout(envRebuildTimer);
    envRebuildTimer = setTimeout(loadEnvironment, 30);
}

function loadEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const nextEnvMap = createMetalEnvironment(pmremGenerator);
    pmremGenerator.dispose();

    if (generatedEnvMap) {
        generatedEnvMap.dispose();
    }

    generatedEnvMap = nextEnvMap;
    scene.environment = generatedEnvMap;
    refreshMaterialEnvironment();
}

function hexToRgb(hex) {
    let value = (hex || '#ffffff').replace('#', '').trim();
    if (value.length === 3) {
        value = value.split('').map(c => c + c).join('');
    }
    const intVal = parseInt(value, 16);
    return {
        r: (intVal >> 16) & 255,
        g: (intVal >> 8) & 255,
        b: intVal & 255
    };
}

function toRgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(alpha, 1))})`;
}

function pseudoRandom(seed) {
    const x = Math.sin(seed * 12.9898) * 43758.5453123;
    return x - Math.floor(x);
}

function drawHighlightStrip(ctx, strip, canvasHeight) {
    const width = Math.max(1, strip.width);
    const alpha = Math.max(0, Math.min(strip.alpha, 1));
    const x = strip.x;

    const horizontal = ctx.createLinearGradient(x, 0, x + width, 0);
    horizontal.addColorStop(0.0, toRgba(strip.top, 0.0));
    horizontal.addColorStop(0.2, toRgba(strip.top, alpha * 0.75));
    horizontal.addColorStop(0.5, toRgba(strip.bottom, alpha));
    horizontal.addColorStop(0.8, toRgba(strip.top, alpha * 0.75));
    horizontal.addColorStop(1.0, toRgba(strip.top, 0.0));
    ctx.fillStyle = horizontal;
    ctx.fillRect(x, 0, width, canvasHeight);

    const verticalTint = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    verticalTint.addColorStop(0.0, toRgba(strip.top, alpha * 0.55));
    verticalTint.addColorStop(1.0, toRgba(strip.bottom, alpha * 0.55));
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = verticalTint;
    ctx.fillRect(x, 0, width, canvasHeight);
    ctx.globalAlpha = 1.0;
}

function drawTintBlock(ctx, block) {
    if (!block.enabled) {
        return;
    }

    const grad = ctx.createLinearGradient(block.x, block.y, block.x + block.width, block.y + block.height);
    grad.addColorStop(0.0, toRgba(block.start, 0.0));
    grad.addColorStop(0.2, toRgba(block.start, block.alpha));
    grad.addColorStop(0.8, toRgba(block.end, block.alpha));
    grad.addColorStop(1.0, toRgba(block.end, 0.0));
    ctx.fillStyle = grad;
    ctx.fillRect(block.x, block.y, block.width, block.height);
}

function createMetalEnvironment(pmremGenerator) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0.0, envParams.bgTop);
    bg.addColorStop(0.5, envParams.bgMid);
    bg.addColorStop(1.0, envParams.bgBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawHighlightStrip(ctx, {
        x: envParams.strip1X,
        width: envParams.strip1Width,
        alpha: envParams.strip1Alpha,
        top: envParams.strip1Top,
        bottom: envParams.strip1Bottom
    }, canvas.height);
    drawHighlightStrip(ctx, {
        x: envParams.strip2X,
        width: envParams.strip2Width,
        alpha: envParams.strip2Alpha,
        top: envParams.strip2Top,
        bottom: envParams.strip2Bottom
    }, canvas.height);
    drawHighlightStrip(ctx, {
        x: envParams.strip3X,
        width: envParams.strip3Width,
        alpha: envParams.strip3Alpha,
        top: envParams.strip3Top,
        bottom: envParams.strip3Bottom
    }, canvas.height);

    drawTintBlock(ctx, {
        enabled: envParams.block1Enabled,
        x: envParams.block1X,
        y: envParams.block1Y,
        width: envParams.block1Width,
        height: envParams.block1Height,
        start: envParams.block1Start,
        end: envParams.block1End,
        alpha: envParams.block1Alpha
    });
    drawTintBlock(ctx, {
        enabled: envParams.block2Enabled,
        x: envParams.block2X,
        y: envParams.block2Y,
        width: envParams.block2Width,
        height: envParams.block2Height,
        start: envParams.block2Start,
        end: envParams.block2End,
        alpha: envParams.block2Alpha
    });

    for (let i = 0; i < envParams.sparkleCount; i++) {
        const x = pseudoRandom(i * 7 + 3) * canvas.width;
        const y = pseudoRandom(i * 11 + 5) * canvas.height;
        const size = Math.max(1.2, pseudoRandom(i * 13 + 7) * envParams.sparkleSize);
        const alpha = envParams.sparkleAlpha * (0.45 + pseudoRandom(i * 17 + 9) * 0.55);
        ctx.globalAlpha = Math.min(alpha, 1.0);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.encoding = THREE.sRGBEncoding;

    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    texture.dispose();
    return envMap;
}

function refreshMaterialEnvironment() {
    materials.forEach((material) => {
        material.needsUpdate = true;
    });
    if (innerMaterial) {
        innerMaterial.needsUpdate = true;
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function wrapHue(value) {
    return ((value % 1) + 1) % 1;
}

function buildFaceColor(index) {
    const base = new THREE.Color(faceColorParams['color' + index]);
    const hsl = { h: 0, s: 0, l: 0 };
    base.getHSL(hsl);

    const hueShift = faceColorParams['hueShift' + index];
    const satMul = faceColorParams['saturation' + index];
    const lightMul = faceColorParams['lightness' + index];
    const separation = faceColorParams.globalSeparation;

    const h = wrapHue(hsl.h + hueShift);
    const s = clamp(hsl.s * satMul * separation, 0, 1);
    const lRaw = clamp(hsl.l * lightMul, 0, 1);
    const l = clamp(0.5 + (lRaw - 0.5) * separation, 0, 1);

    return new THREE.Color().setHSL(h, s, l);
}

function updateFaceMaterials() {
    if (!materials || materials.length < 3) {
        return;
    }

    for (let i = 0; i < 3; i++) {
        materials[i].color.copy(buildFaceColor(i + 1));
        materials[i].needsUpdate = true;
    }
}

function assignKnown(target, values) {
    if (!values) {
        return;
    }
    Object.keys(values).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
            target[key] = values[key];
        }
    });
}

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function deepMerge(base, override) {
    const result = deepClone(base);
    if (!override || typeof override !== 'object') {
        return result;
    }
    Object.keys(override).forEach((key) => {
        const source = override[key];
        if (
            source &&
            typeof source === 'object' &&
            !Array.isArray(source) &&
            result[key] &&
            typeof result[key] === 'object' &&
            !Array.isArray(result[key])
        ) {
            result[key] = deepMerge(result[key], source);
        } else {
            result[key] = source;
        }
    });
    return result;
}

function loadColorPresets() {
    const presets = deepClone(DEFAULT_COLOR_PRESETS);
    try {
        const raw = localStorage.getItem(PRESET_STORAGE_KEY);
        if (!raw) return presets;
        const stored = JSON.parse(raw);
        if (!stored || typeof stored !== 'object') return presets;
        Object.keys(stored).forEach((name) => {
            if (presets[name]) {
                presets[name] = deepMerge(presets[name], stored[name]);
            }
        });
        return presets;
    } catch (error) {
        console.warn('读取本地模板失败，将使用默认模板', error);
        return presets;
    }
}

function persistColorPresets() {
    try {
        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(colorPresets));
    } catch (error) {
        console.warn('保存本地模板失败', error);
    }
}

function snapshotCurrentPreset() {
    return {
        materialParams: deepClone(materialParams),
        faceColorParams: deepClone(faceColorParams),
        envParams: deepClone(envParams)
    };
}

function saveCurrentPreset() {
    const name = presetState.theme;
    colorPresets[name] = snapshotCurrentPreset();
    persistColorPresets();
}

function restoreCurrentPresetDefault() {
    const name = presetState.theme;
    colorPresets[name] = deepClone(DEFAULT_COLOR_PRESETS[name] || {});
    persistColorPresets();
    applyPreset(name, { transition: PRESET_TRANSITION_MODES.FLIP });
}

function updateGuiFolderDisplay(folder) {
    if (!folder) {
        return;
    }

    if (Array.isArray(folder.__controllers)) {
        folder.__controllers.forEach((controller) => controller.updateDisplay());
    }

    if (folder.__folders) {
        Object.values(folder.__folders).forEach(updateGuiFolderDisplay);
    }
}

function isGrayMetalThemeName(name) {
    const theme = String(name || '').trim();
    if (!theme) {
        return false;
    }
    if (theme === '金属灰翻转金色') {
        return true;
    }
    return DISALLOWED_GRAY_THEME_PATTERN.test(theme);
}

function resolvePreferredPresetFallback() {
    const names = Object.keys(colorPresets || {});
    const prioritized = MUSIC_COLOR_PRESET_PRIORITY.find((name) => colorPresets[name]);
    if (prioritized) {
        return prioritized;
    }
    const firstNonGray = names.find((name) => !isGrayMetalThemeName(name));
    if (firstNonGray) {
        return firstNonGray;
    }
    return names[0] || '春节纯洁红';
}

function buildResolvedPresetState(themeName) {
    const fallbackName = resolvePreferredPresetFallback();
    const resolvedName = colorPresets[themeName] ? themeName : fallbackName;
    const preset = colorPresets[resolvedName] || {};

    const nextMaterialParams = deepClone(BASE_MATERIAL_PARAMS);
    const nextFaceColorParams = deepClone(BASE_FACE_COLOR_PARAMS);
    const nextEnvParams = deepClone(BASE_ENV_PARAMS);

    assignKnown(nextMaterialParams, preset.materialParams);
    assignKnown(nextFaceColorParams, preset.faceColorParams);
    assignKnown(nextEnvParams, preset.envParams);

    return {
        name: resolvedName,
        materialParams: nextMaterialParams,
        faceColorParams: nextFaceColorParams,
        envParams: nextEnvParams
    };
}

function snapshotLivePresetState(name = '') {
    return {
        name,
        materialParams: deepClone(materialParams),
        faceColorParams: deepClone(faceColorParams),
        envParams: deepClone(envParams)
    };
}

function applyResolvedPresetState(resolvedState, options = {}) {
    if (!resolvedState) {
        return;
    }

    assignKnown(materialParams, resolvedState.materialParams);
    assignKnown(faceColorParams, resolvedState.faceColorParams);
    assignKnown(envParams, resolvedState.envParams);
    presetState.theme = resolvedState.name;

    updateFaceMaterials();
    updateMetalMaterials();

    if (renderer && options.reloadEnvironment !== false) {
        loadEnvironment();
    }

    if (guiPanel && options.syncGui !== false) {
        updateGuiFolderDisplay(guiPanel);
    }
    refreshQuickSwitchPanelState();
}

function normalizePresetTransitionMode(mode) {
    const value = String(mode || PRESET_TRANSITION_MODES.BLEND).trim().toLowerCase();
    if (value === PRESET_TRANSITION_MODES.IMMEDIATE) {
        return PRESET_TRANSITION_MODES.IMMEDIATE;
    }
    if (value === PRESET_TRANSITION_MODES.FLIP) {
        return PRESET_TRANSITION_MODES.FLIP;
    }
    return PRESET_TRANSITION_MODES.BLEND;
}

function setColorSafely(color, value, fallbackHex) {
    try {
        color.set(value || fallbackHex);
    } catch (error) {
        color.set(fallbackHex);
    }
}

function mixHexColor(fromValue, toValue, t, fallbackHex = '#ffffff') {
    setColorSafely(presetColorMixA, fromValue, fallbackHex);
    setColorSafely(presetColorMixB, toValue, fallbackHex);
    presetColorMixA.lerp(presetColorMixB, clamp(t, 0, 1));
    return `#${presetColorMixA.getHexString()}`;
}

function interpolatePresetState(fromState, toState, t) {
    const eased = 1 - Math.pow(1 - clamp(t, 0, 1), 3);

    Object.keys(BASE_MATERIAL_PARAMS).forEach((key) => {
        const fallback = BASE_MATERIAL_PARAMS[key];
        const fromValue = Number(fromState.materialParams[key]);
        const toValue = Number(toState.materialParams[key]);
        materialParams[key] = Number.isFinite(fromValue) && Number.isFinite(toValue)
            ? lerpNumber(fromValue, toValue, eased)
            : Number(toState.materialParams[key] ?? fallback);
    });

    Object.keys(BASE_FACE_COLOR_PARAMS).forEach((key) => {
        const fallback = BASE_FACE_COLOR_PARAMS[key];
        const fromValue = fromState.faceColorParams[key];
        const toValue = toState.faceColorParams[key];
        if (typeof fallback === 'string') {
            faceColorParams[key] = mixHexColor(fromValue, toValue, eased, fallback);
            return;
        }
        faceColorParams[key] = Number.isFinite(Number(fromValue)) && Number.isFinite(Number(toValue))
            ? lerpNumber(Number(fromValue), Number(toValue), eased)
            : Number(toValue ?? fallback);
    });

    Object.keys(BASE_ENV_PARAMS).forEach((key) => {
        const fallback = BASE_ENV_PARAMS[key];
        const fromValue = fromState.envParams[key];
        const toValue = toState.envParams[key];

        if (typeof fallback === 'string') {
            envParams[key] = mixHexColor(fromValue, toValue, eased, fallback);
            return;
        }
        if (typeof fallback === 'number') {
            envParams[key] = Number.isFinite(Number(fromValue)) && Number.isFinite(Number(toValue))
                ? lerpNumber(Number(fromValue), Number(toValue), eased)
                : Number(toValue ?? fallback);
            return;
        }
        if (typeof fallback === 'boolean') {
            envParams[key] = eased < 0.5 ? Boolean(fromValue) : Boolean(toValue);
            return;
        }
        envParams[key] = eased < 0.5 ? fromValue : toValue;
    });
}

function triggerPresetFlipBurst() {
    const minDamping = clamp(PRESET_TRANSITION_CONFIG.manualFlipDampingMin, 0.04, 0.25);
    const maxDamping = clamp(PRESET_TRANSITION_CONFIG.manualFlipDampingMax, minDamping, 0.25);
    for (const group of pixels) {
        if (!group || !group.userData || group.userData.isRim) {
            continue;
        }
        const damping = lerpNumber(minDamping, maxDamping, Math.random());
        queueGroupStepFlip(group, 1, damping);
        queueGroupStepFlip(group, 2, damping);
    }
}

function startPresetTransition(resolvedState, options = {}) {
    const mode = normalizePresetTransitionMode(options.transition);
    if (mode === PRESET_TRANSITION_MODES.IMMEDIATE) {
        presetTransitionState = null;
        applyResolvedPresetState(resolvedState, { reloadEnvironment: true, syncGui: true });
        return;
    }

    const durationMs = clamp(
        Math.floor(Number(options.durationMs || PRESET_TRANSITION_CONFIG.blendDurationMs)),
        80,
        1200
    );
    const delayMs = mode === PRESET_TRANSITION_MODES.FLIP
        ? clamp(Number(options.delayMs ?? PRESET_TRANSITION_CONFIG.manualFlipDelayMs), 0, 260)
        : 0;

    if (mode === PRESET_TRANSITION_MODES.FLIP) {
        triggerPresetFlipBurst();
    }

    presetTransitionState = {
        fromState: snapshotLivePresetState(),
        toState: resolvedState,
        startAt: performance.now() + delayMs,
        durationMs
    };
}

function updatePresetTransition(now) {
    if (!presetTransitionState) {
        return;
    }
    if (now < presetTransitionState.startAt) {
        return;
    }

    const elapsed = now - presetTransitionState.startAt;
    const t = clamp(elapsed / Math.max(1, presetTransitionState.durationMs), 0, 1);
    interpolatePresetState(presetTransitionState.fromState, presetTransitionState.toState, t);
    updateFaceMaterials();
    updateMetalMaterials();

    if (t >= 1) {
        const targetState = presetTransitionState.toState;
        presetTransitionState = null;
        applyResolvedPresetState(targetState, { reloadEnvironment: true, syncGui: true });
    }
}

function applyPreset(themeName, options = {}) {
    const resolvedState = buildResolvedPresetState(themeName);
    presetState.theme = resolvedState.name;
    refreshQuickSwitchPanelState();
    startPresetTransition(resolvedState, options);
}

function normalizeSpringEffectName(effect) {
    if (WAVE_EFFECTS.includes(effect)) {
        return effect;
    }
    return WAVE_EFFECTS[0] || '效果1-行波';
}

function applySpringEffectSelection(effect, options = {}) {
    const safeEffect = normalizeSpringEffectName(effect);
    const prevEffect = String(springWaveConfig.effect || '');
    const changed = prevEffect !== safeEffect;
    springWaveConfig.effect = safeEffect;
    experienceState.currentEffect = safeEffect;
    if (guiPanel) {
        updateGuiFolderDisplay(guiPanel);
    }
    refreshQuickSwitchPanelState();

    const shouldRestart = options.restart === true || (options.restart !== false && springWaveState.running);
    const shouldForceRestart = options.forceRestart === true;
    if ((changed || shouldForceRestart) && shouldRestart && isSpringFestivalMode()) {
        // startSpringWave 内部会先 resetPose，再启动新效果
        void startSpringWave();
    }
    return changed;
}

function setPanelVisible(visible) {
    panelState.visible = !!visible;
    const uiEl = document.getElementById('ui');
    const guiEl = document.getElementById('gui-container');
    const toggleBtn = document.getElementById('settings-toggle');

    if (uiEl) {
        uiEl.style.display = panelState.visible ? 'block' : 'none';
    }
    if (guiEl) {
        guiEl.style.display = panelState.visible ? 'block' : 'none';
    }
    if (toggleBtn) {
        toggleBtn.textContent = panelState.visible ? '收起调试' : '调试设置';
    }
}

function setupSettingsToggle() {
    const toggleBtn = document.getElementById('settings-toggle');
    if (!toggleBtn || toggleBtn.dataset.bound === '1') {
        return;
    }
    toggleBtn.dataset.bound = '1';
    toggleBtn.addEventListener('click', () => {
        setPanelVisible(!panelState.visible);
    });
}

function updateExperienceStatus(message) {
    const statusEl = document.getElementById('experience-status');
    if (!statusEl) {
        return;
    }
    statusEl.textContent = String(message || '请选择一首音乐开始编排');
}

function setExperienceUiPlaying(playing) {
    const root = document.getElementById('experience-ui');
    if (!root) {
        return;
    }
    if (playing) {
        root.classList.add('is-playing');
    } else {
        root.classList.remove('is-playing');
    }
}

function renderPresetMusicButtons() {
    const container = document.getElementById('preset-music-list');
    if (!container) {
        return;
    }
    container.innerHTML = '';
    PRESET_MUSIC_LIBRARY.forEach((item) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'preset-music-btn';
        btn.textContent = item.label;
        btn.addEventListener('click', async () => {
            try {
                updateExperienceStatus(`已选择：${item.label}，准备加载音频...`);
                await loadMusicFromUrl({
                    url: item.file,
                    startAfterLoad: true,
                    trackName: item.label
                });
            } catch (error) {
                const message = error && error.message ? error.message : '预设音乐加载失败';
                updateExperienceStatus(message);
            }
        });
        container.appendChild(btn);
    });
}

function getQuickSwitchElements() {
    return {
        root: document.getElementById('quick-switch-panel'),
        colorList: document.getElementById('quick-color-list'),
        effectList: document.getElementById('quick-effect-list')
    };
}

function getOrderedQuickPresetNames() {
    const names = Object.keys(colorPresets || {});
    if (!names.length) {
        return [];
    }
    const prioritized = MUSIC_COLOR_PRESET_PRIORITY.filter((name) => names.includes(name));
    const rest = names.filter((name) => !prioritized.includes(name));
    return [...prioritized, ...rest];
}

function refreshQuickSwitchPanelState() {
    const els = getQuickSwitchElements();
    if (!els.root) {
        return;
    }

    const activeTheme = String(presetState.theme || '');
    const activeEffect = String(springWaveConfig.effect || '');

    const colorButtons = els.root.querySelectorAll('[data-quick-preset]');
    colorButtons.forEach((button) => {
        const isActive = button.dataset.quickPreset === activeTheme;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const effectButtons = els.root.querySelectorAll('[data-quick-effect]');
    effectButtons.forEach((button) => {
        const isActive = button.dataset.quickEffect === activeEffect;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function renderQuickColorButtons() {
    const { colorList } = getQuickSwitchElements();
    if (!colorList) {
        return;
    }
    colorList.innerHTML = '';
    const names = getOrderedQuickPresetNames();
    names.forEach((name) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quick-switch-btn';
        button.textContent = name;
        button.dataset.quickPreset = name;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => {
            applyPreset(name, { transition: PRESET_TRANSITION_MODES.FLIP });
            if (experienceState.active) {
                updateExperienceStatus(`正在播放：${experienceState.trackName || '当前音乐'} ｜ ${springWaveConfig.effect} ｜ 配色 ${presetState.theme}`);
            } else {
                updateExperienceStatus(`已切换配色：${presetState.theme}`);
            }
        });
        colorList.appendChild(button);
    });
}

function renderQuickEffectButtons() {
    const { effectList } = getQuickSwitchElements();
    if (!effectList) {
        return;
    }
    effectList.innerHTML = '';
    WAVE_EFFECTS.forEach((effect) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quick-switch-btn';
        button.textContent = effect;
        button.dataset.quickEffect = effect;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => {
            if (!isSpringFestivalMode()) {
                const changed = applySpringEffectSelection(effect, { restart: false });
                if (changed) {
                    updateExperienceStatus(`已选择动画：${effect}（切换到春晚模式后可播放）`);
                }
                return;
            }
            const changed = applySpringEffectSelection(effect, { restart: true, forceRestart: true });
            if (changed) {
                updateExperienceStatus(`已切换动画：${effect}`);
            } else {
                updateExperienceStatus(`已重启动画：${effect}`);
            }
        });
        effectList.appendChild(button);
    });
}

function setupQuickSwitchPanel() {
    const els = getQuickSwitchElements();
    if (!els.root) {
        return;
    }
    renderQuickColorButtons();
    renderQuickEffectButtons();
    refreshQuickSwitchPanelState();
}

function setupExperienceUi() {
    const uploadBtn = document.getElementById('upload-music-btn');
    if (uploadBtn && uploadBtn.dataset.bound !== '1') {
        uploadBtn.dataset.bound = '1';
        uploadBtn.addEventListener('click', () => {
            updateExperienceStatus('请选择本地歌曲文件...');
            pickLocalMusicFile();
        });
    }
    renderPresetMusicButtons();
    setupQuickSwitchPanel();
    void loadLyricsLibrary();
    setupTransportControls();
}

function formatPlayerTime(seconds) {
    const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
    const total = Math.floor(safe);
    const mm = Math.floor(total / 60);
    const ss = total % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function formatLyricTimestamp(seconds) {
    const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
    const totalCs = Math.round(safe * 100);
    const mm = Math.floor(totalCs / 6000);
    const ss = Math.floor((totalCs % 6000) / 100);
    const cs = totalCs % 100;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function getTransportElements() {
    return {
        root: document.getElementById('music-transport'),
        toggle: document.getElementById('transport-play-toggle'),
        seek: document.getElementById('transport-seek'),
        current: document.getElementById('transport-current'),
        duration: document.getElementById('transport-duration')
    };
}

function setTransportSeekVisual(input, value, max) {
    if (!input) {
        return;
    }
    const safeMax = Math.max(1, Number(max || 0));
    const safeValue = clamp(Number(value || 0), 0, safeMax);
    const pct = (safeValue / safeMax) * 100;
    input.style.setProperty('--seek-progress', `${pct.toFixed(3)}%`);
}

function getTransportDurationSec(audio, options = {}) {
    if (!audio) {
        return 0;
    }
    const opts = (options && typeof options === 'object') ? options : {};
    const rawDuration = Number(audio.duration);
    if (Number.isFinite(rawDuration) && rawDuration > 0) {
        return rawDuration;
    }
    if (audio.seekable && audio.seekable.length > 0) {
        try {
            const seekableEnd = Number(audio.seekable.end(audio.seekable.length - 1));
            if (Number.isFinite(seekableEnd) && seekableEnd > 0) {
                return seekableEnd;
            }
        } catch (error) {
            // ignore seekable range read failure and continue with other fallbacks
        }
    }
    if (opts.allowLyricFallback === true) {
        const lyricDuration = Number(lyricState.durationSec);
        if (Number.isFinite(lyricDuration) && lyricDuration > 1) {
            return lyricDuration;
        }
    }
    return 0;
}

function updateTransportUi() {
    const els = getTransportElements();
    if (!els.root || !els.toggle || !els.seek || !els.current || !els.duration) {
        return;
    }

    const audio = musicDriveState.audioEl;
    const hasSource = !!(audio && audio.src);
    const duration = hasSource ? getTransportDurationSec(audio, { allowLyricFallback: true }) : 0;
    const currentTimeRaw = hasSource ? Number(audio.currentTime || 0) : 0;
    const currentCap = Math.max(duration, currentTimeRaw, 0);
    const current = hasSource
        ? (transportState.dragging
            ? clamp((transportState.dragValue / 1000) * Math.max(duration, 0), 0, currentCap)
            : clamp(currentTimeRaw, 0, currentCap))
        : 0;
    const paused = !hasSource || !audio || audio.paused;

    els.toggle.textContent = paused ? '播放' : '暂停';
    els.toggle.disabled = !hasSource;
    els.seek.disabled = !hasSource || duration <= 0;
    els.current.textContent = formatPlayerTime(current);
    els.duration.textContent = formatPlayerTime(duration);

    const sliderValue = duration > 0 ? Math.round((current / duration) * 1000) : 0;
    if (!transportState.dragging) {
        els.seek.value = String(sliderValue);
    }
    setTransportSeekVisual(els.seek, Number(els.seek.value), 1000);
}

async function toggleTransportPlayPause() {
    const audio = musicDriveState.audioEl;
    if (!audio || !audio.src) {
        return;
    }
    try {
        if (audio.paused) {
            await ensureMusicAnalyser();
            await audio.play();
            musicDriveState.running = true;
        } else {
            audio.pause();
        }
    } catch (error) {
        console.warn('播放控制失败', error);
    }
    updateTransportUi();
}

function seekTransportToRatio(ratio) {
    const audio = musicDriveState.audioEl;
    if (!audio || !audio.src) {
        return;
    }
    const duration = getTransportDurationSec(audio, { allowLyricFallback: true });
    if (!Number.isFinite(duration) || duration <= 0) {
        return;
    }
    const safe = clamp(Number(ratio), 0, 1);
    const targetTime = safe * duration;
    try {
        audio.currentTime = targetTime;
    } catch (error) {
        console.warn('时间轴定位失败', error);
    }
    if (lyricDebugConfig.lineDebugMode) {
        if (!audio.paused) {
            audio.pause();
        }
        lyricState.debugSelectionLocked = false;
        const activeIndex = getLyricDebugActiveIndexFromTime(Number(audio.currentTime));
        if (activeIndex >= 0) {
            setLyricDebugAnchor(activeIndex);
        }
        updateLyricLineDebugStatus();
    }
    updateTransportUi();
}

function setupTransportControls() {
    if (transportState.ready) {
        return;
    }
    const els = getTransportElements();
    if (!els.root || !els.toggle || !els.seek) {
        return;
    }
    transportState.ready = true;

    els.toggle.addEventListener('click', () => {
        toggleTransportPlayPause();
    });

    const startDrag = () => {
        transportState.dragValue = clamp(Number(els.seek.value || 0), 0, 1000);
        transportState.dragging = true;
    };
    const endDrag = (force = false) => {
        if (!transportState.dragging && !force) {
            return;
        }
        transportState.dragging = false;
        seekTransportToRatio(transportState.dragValue / 1000);
    };
    els.seek.addEventListener('pointerdown', startDrag);
    els.seek.addEventListener('pointerup', endDrag);
    els.seek.addEventListener('change', () => endDrag(true));
    els.seek.addEventListener('input', (event) => {
        const target = event.target;
        const value = Number(target && target.value ? target.value : 0);
        transportState.dragValue = clamp(value, 0, 1000);
        setTransportSeekVisual(els.seek, transportState.dragValue, 1000);
        if (lyricDebugConfig.lineDebugMode) {
            seekTransportToRatio(transportState.dragValue / 1000);
            return;
        }
        if (transportState.dragging) {
            updateTransportUi();
        }
    });

    updateTransportUi();
}

function normalizeSongKey(name) {
    return String(name || '')
        .trim()
        .replace(/\.[a-z0-9]{2,5}(?:[?#].*)?$/i, '')
        .toLowerCase()
        .replace(/%20/g, ' ')
        .replace(/[《》\s_\-—–.,，。!！?？:：;；"'`~·、()（）【】\[\]]+/g, '');
}

function sanitizeLyricLine(line) {
    return String(line || '')
        .replace(/^[\-*•]+\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function isLikelyLyricMetaLine(line) {
    const compact = String(line || '').replace(/\s+/g, '');
    if (!compact) {
        return true;
    }
    if (/门票$/.test(compact) || /歌词$/.test(compact)) {
        return true;
    }
    if (/^(演唱|作词|作曲|词曲|编曲|制作人|监制|和声编写|和声录音|和声|混音师|母带工程师|录音师|吉他录音|人声录音棚|录音棚|钢琴|吉他|鼓|管乐|贝斯|弦乐)[：:]/.test(compact)) {
        return true;
    }
    if (/[A-Za-z@]/.test(compact) && /(studio|mastering|sync|workshop|record)/i.test(compact)) {
        return true;
    }
    if (/^(词|曲)[：:]/.test(compact)) {
        return true;
    }
    return false;
}

function parseTimedLyricLine(line) {
    const match = String(line || '').match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.+)$/);
    if (!match) {
        return null;
    }
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const fractionRaw = String(match[3] || '0');
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
        return null;
    }
    const fraction = fractionRaw.length === 0
        ? 0
        : Number(`0.${fractionRaw.padEnd(3, '0').slice(0, 3)}`);
    const start = minutes * 60 + seconds + (Number.isFinite(fraction) ? fraction : 0);
    const text = sanitizeLyricLine(match[4]);
    if (!text) {
        return null;
    }
    return {
        start: Math.max(0, start),
        text
    };
}

function parseLyricsMarkdown(markdownText) {
    const lines = String(markdownText || '').split(/\r?\n/);
    const sections = [];
    let currentTitle = '';
    let currentLines = [];
    let currentTimedLines = [];

    function flushSection() {
        if (!currentTitle || currentLines.length === 0) {
            currentTitle = '';
            currentLines = [];
            currentTimedLines = [];
            return;
        }
        const key = normalizeSongKey(currentTitle);
        if (key) {
            sections.push({
                title: currentTitle,
                key,
                lines: currentLines.slice(),
                timedLines: currentTimedLines.slice()
            });
        }
        currentTitle = '';
        currentLines = [];
        currentTimedLines = [];
    }

    for (const raw of lines) {
        const line = String(raw || '').trim();
        if (!line) {
            continue;
        }

        const titleMatch = line.match(/^#{0,4}\s*《\s*([^》]+)\s*》/);
        if (titleMatch) {
            flushSection();
            currentTitle = titleMatch[1].trim();
            continue;
        }

        if (!currentTitle) {
            continue;
        }
        const timed = parseTimedLyricLine(line);
        if (timed) {
            currentLines.push(timed.text);
            currentTimedLines.push(timed);
            continue;
        }
        if (isLikelyLyricMetaLine(line)) {
            continue;
        }

        const clean = sanitizeLyricLine(line);
        if (clean) {
            currentLines.push(clean);
        }
    }

    flushSection();
    const library = new Map();
    for (const section of sections) {
        library.set(section.key, section);
    }
    return library;
}

function buildTimelineFromTimedLines(timedLines, durationSec) {
    if (!Array.isArray(timedLines) || timedLines.length === 0) {
        return [];
    }
    const source = timedLines
        .filter((item) => item && Number.isFinite(item.start) && String(item.text || '').trim())
        .map((item) => ({
            start: Math.max(0, Number(item.start)),
            text: String(item.text || '').trim()
        }))
        .sort((a, b) => a.start - b.start);
    if (!source.length) {
        return [];
    }

    const hasDuration = Number.isFinite(durationSec) && durationSec > 1;
    const maxEnd = hasDuration ? Number(durationSec) : Number.POSITIVE_INFINITY;
    const timeline = [];
    let prevStart = -1;
    for (let i = 0; i < source.length; i++) {
        const current = source[i];
        const next = source[i + 1];
        const safeStart = Math.min(maxEnd, Math.max(0, Math.max(current.start, prevStart + 0.05)));
        const nextStartRaw = next ? Math.max(next.start, safeStart + 0.05) : (safeStart + 2.2);
        const safeEnd = Math.min(maxEnd, Math.max(safeStart + 0.05, nextStartRaw));
        timeline.push({
            index: i,
            text: current.text,
            start: safeStart,
            end: safeEnd
        });
        prevStart = safeStart;
    }
    return timeline;
}

async function loadLyricsLibrary() {
    if (lyricState.loaded && lyricState.library.size > 0) {
        return true;
    }
    if (lyricState.loadingPromise) {
        return lyricState.loadingPromise;
    }
    lyricState.loadingPromise = (async () => {
        try {
            let markdown = '';
            let loadedPath = '';
            for (const path of LYRICS_MARKDOWN_PATHS) {
                try {
                    const response = await fetch(path, { cache: 'no-store' });
                    if (!response.ok) {
                        continue;
                    }
                    markdown = await response.text();
                    loadedPath = path;
                    break;
                } catch (error) {
                    // try next fallback path
                }
            }
            if (!markdown) {
                throw new Error('歌词文件读取失败');
            }
            lyricState.library = parseLyricsMarkdown(markdown);
            lyricState.loaded = lyricState.library.size > 0;
            if (!lyricState.loaded) {
                console.warn('歌词文件已加载，但未解析出有效歌词段落');
            } else {
                console.info(`歌词文件已加载: ${loadedPath}`);
            }
            return lyricState.loaded;
        } catch (error) {
            console.warn('歌词加载失败，将继续仅播放动效', error);
            lyricState.library = new Map();
            lyricState.loaded = false;
            return false;
        } finally {
            lyricState.loadingPromise = null;
        }
    })();
    return lyricState.loadingPromise;
}

function getLyricsOverlayElements() {
    return {
        root: document.getElementById('lyrics-overlay'),
        main: document.getElementById('lyric-main'),
        next: document.getElementById('lyric-next')
    };
}

function clearLyricDisplay() {
    const els = getLyricsOverlayElements();
    if (!els.root || !els.main || !els.next) {
        return;
    }
    els.main.textContent = '';
    els.next.textContent = '';
    els.main.classList.remove(...LYRIC_ANIMATION_CLASSES);
    els.root.classList.remove('is-active', 'is-beat');
}

function updateLyricDebugStatus(message) {
    lyricDebugConfig.status = String(message || '歌词调试：未加载');
}

function getLyricDebugActiveIndexFromTime(timeSec) {
    if (!lyricState.timeline.length || !Number.isFinite(timeSec)) {
        return -1;
    }
    const matched = findLyricIndexByTime(timeSec);
    if (matched >= 0) {
        return matched;
    }
    return timeSec < lyricState.timeline[0].start ? 0 : (lyricState.timeline.length - 1);
}

function updateLyricLineDebugStatus(prefix = '歌词调试：逐句模式') {
    if (!lyricDebugConfig.lineDebugMode) {
        return;
    }
    if (!lyricState.timeline.length) {
        updateLyricDebugStatus(`${prefix}（当前无歌词时间轴）`);
        return;
    }
    const safeIndex = clamp(lyricState.debugAnchorIndex, 0, lyricState.timeline.length - 1);
    const item = lyricState.timeline[safeIndex];
    const audio = musicDriveState.audioEl;
    const at = audio && Number.isFinite(audio.currentTime)
        ? formatPlayerTime(audio.currentTime)
        : '--:--';
    const rawText = String(item && item.text ? item.text : '').trim();
    const text = rawText.length > 24 ? `${rawText.slice(0, 24)}…` : rawText;
    updateLyricDebugStatus(`${prefix} 第${safeIndex + 1}/${lyricState.timeline.length}句 @${at} ${text}`);
}

function setLyricDebugAnchor(index, options = {}) {
    if (!lyricState.timeline.length) {
        lyricState.debugAnchorIndex = -1;
        lyricState.debugSelectionLocked = false;
        lyricState.currentIndex = -1;
        clearLyricDisplay();
        return;
    }
    const seekAudio = options.seekAudio === true;
    const lockSelection = options.lockSelection === true;
    const safeIndex = clamp(Number(index || 0), 0, lyricState.timeline.length - 1);
    const line = lyricState.timeline[safeIndex];
    if (!line) {
        return;
    }
    lyricState.debugAnchorIndex = safeIndex;
    lyricState.debugSelectionLocked = lockSelection;
    lyricState.currentIndex = safeIndex;

    if (seekAudio) {
        const audio = musicDriveState.audioEl;
        if (audio && Number.isFinite(line.start)) {
            if (!audio.paused) {
                audio.pause();
            }
            const duration = Number.isFinite(audio.duration) && audio.duration > 0
                ? audio.duration
                : Number.POSITIVE_INFINITY;
            audio.currentTime = clamp(line.start, 0, duration);
            updateTransportUi();
        }
    }

    applyLyricLine(safeIndex);
    const els = getLyricsOverlayElements();
    if (els.root) {
        els.root.classList.remove('is-beat');
    }
}

function syncLyricDebugAnchorFromPlayback() {
    const audio = musicDriveState.audioEl;
    const timeSec = Number(audio && audio.currentTime);
    const next = getLyricDebugActiveIndexFromTime(timeSec);
    if (next < 0) {
        return -1;
    }
    lyricState.debugAnchorIndex = next;
    lyricState.debugSelectionLocked = false;
    return next;
}

function setLyricLineDebugMode(enabled) {
    lyricDebugConfig.lineDebugMode = enabled === true;
    if (!lyricDebugConfig.lineDebugMode) {
        lyricState.debugAnchorIndex = -1;
        lyricState.debugSelectionLocked = false;
        const els = getLyricsOverlayElements();
        if (els.root) {
            els.root.classList.remove('is-beat');
        }
        if (lyricState.activeSongTitle) {
            updateLyricDebugStatus(
                `歌词调试：${lyricState.activeSongTitle} 偏移 ${lyricDebugConfig.offsetSec.toFixed(2)}s 缩放 ${lyricDebugConfig.timeScale.toFixed(4)}`
            );
        } else {
            updateLyricDebugStatus('歌词调试：未加载');
        }
        return;
    }

    const audio = musicDriveState.audioEl;
    if (audio && !audio.paused) {
        audio.pause();
    }

    const activeIndex = syncLyricDebugAnchorFromPlayback();
    if (activeIndex >= 0) {
        setLyricDebugAnchor(activeIndex);
    } else if (lyricState.timeline.length > 0) {
        setLyricDebugAnchor(0);
    }
    updateLyricLineDebugStatus('歌词调试：逐句模式已开启');
    updateTransportUi();
}

function nudgeLyricDebugPlayhead(deltaSec) {
    const audio = musicDriveState.audioEl;
    if (!audio || !audio.src) {
        updateLyricDebugStatus('歌词调试：未加载音频，无法移动时间轴');
        return;
    }
    if (!lyricDebugConfig.lineDebugMode) {
        setLyricLineDebugMode(true);
    }
    if (!audio.paused) {
        audio.pause();
    }
    const duration = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : Number.POSITIVE_INFINITY;
    const nextTime = clamp((Number(audio.currentTime) || 0) + Number(deltaSec || 0), 0, duration);
    audio.currentTime = nextTime;
    lyricState.debugSelectionLocked = false;
    const nextIndex = getLyricDebugActiveIndexFromTime(nextTime);
    if (nextIndex >= 0) {
        setLyricDebugAnchor(nextIndex);
    }
    updateLyricLineDebugStatus();
    updateTransportUi();
}

function jumpLyricDebugLine(step) {
    if (!lyricState.timeline.length) {
        updateLyricDebugStatus('歌词调试：当前没有可调试歌词');
        return;
    }
    if (!lyricDebugConfig.lineDebugMode) {
        setLyricLineDebugMode(true);
    }
    let baseIndex = lyricState.debugAnchorIndex;
    if (baseIndex < 0) {
        baseIndex = syncLyricDebugAnchorFromPlayback();
    }
    if (baseIndex < 0) {
        baseIndex = 0;
    }
    const targetIndex = clamp(baseIndex + Math.sign(Number(step || 0)), 0, lyricState.timeline.length - 1);
    setLyricDebugAnchor(targetIndex, { seekAudio: false, lockSelection: true });
    updateLyricLineDebugStatus('歌词调试：已切换目标句');
    updateTransportUi();
}

function confirmCurrentLyricDebugLine() {
    const audio = musicDriveState.audioEl;
    if (!audio || !Number.isFinite(audio.currentTime) || !lyricState.baseTimeline.length) {
        updateLyricDebugStatus('歌词调试：无法确认，需先加载音频与歌词');
        return;
    }
    let activeIndex = lyricState.debugAnchorIndex;
    if (activeIndex < 0) {
        activeIndex = syncLyricDebugAnchorFromPlayback();
    }
    if (activeIndex < 0) {
        updateLyricDebugStatus('歌词调试：当前未选中歌词句');
        return;
    }
    const safeIndex = clamp(activeIndex, 0, lyricState.baseTimeline.length - 1);
    const baseStart = Number(lyricState.baseTimeline[safeIndex].start || 0);
    lyricDebugConfig.offsetSec = clamp(audio.currentTime - baseStart * lyricDebugConfig.timeScale, -120, 120);
    lyricState.debugSelectionLocked = false;
    applyLyricTimingAdjustments({ keepCurrent: true });

    const nextIndex = getLyricDebugActiveIndexFromTime(Number(audio.currentTime));
    if (nextIndex >= 0) {
        setLyricDebugAnchor(nextIndex, { lockSelection: false });
    }
    updateLyricLineDebugStatus('歌词调试：已确认当前句');
}

function buildAdjustedLyricTimeline(baseTimeline, options = {}) {
    const source = Array.isArray(baseTimeline) ? baseTimeline : [];
    if (!source.length) {
        return [];
    }
    const scale = clamp(Number(options.scale ?? lyricDebugConfig.timeScale), 0.6, 1.6);
    const offset = clamp(Number(options.offset ?? lyricDebugConfig.offsetSec), -120, 120);
    const durationCap = Number.isFinite(lyricState.durationSec) && lyricState.durationSec > 0
        ? lyricState.durationSec
        : Number.POSITIVE_INFINITY;
    const minGap = 0.05;

    const projected = source
        .map((item, index) => ({
            index,
            text: String(item.text || ''),
            start: Math.max(0, Number(item.start || 0) * scale + offset)
        }))
        .sort((a, b) => a.start - b.start);

    for (let i = 1; i < projected.length; i++) {
        projected[i].start = Math.max(projected[i].start, projected[i - 1].start + minGap);
    }

    return projected.map((item, index) => {
        const next = projected[index + 1];
        const nextStart = next ? next.start : (item.start + 2.2);
        const end = Math.min(durationCap, Math.max(item.start + minGap, nextStart));
        return {
            index,
            text: item.text,
            start: item.start,
            end
        };
    });
}

function applyLyricTimingAdjustments(options = {}) {
    const keepCurrent = options.keepCurrent === true;
    lyricState.timeline = buildAdjustedLyricTimeline(lyricState.baseTimeline, {
        scale: lyricDebugConfig.timeScale,
        offset: lyricDebugConfig.offsetSec
    });
    if (!keepCurrent) {
        lyricState.currentIndex = -1;
        clearLyricDisplay();
    }
    if (lyricState.activeSongTitle) {
        updateLyricDebugStatus(
            `歌词调试：${lyricState.activeSongTitle} 偏移 ${lyricDebugConfig.offsetSec.toFixed(2)}s 缩放 ${lyricDebugConfig.timeScale.toFixed(4)}`
        );
    }
    if (lyricDebugConfig.lineDebugMode) {
        if (lyricState.debugSelectionLocked && lyricState.debugAnchorIndex >= 0) {
            setLyricDebugAnchor(lyricState.debugAnchorIndex, { lockSelection: true });
        } else {
            const activeIndex = syncLyricDebugAnchorFromPlayback();
            if (activeIndex >= 0) {
                setLyricDebugAnchor(activeIndex);
            }
        }
        updateLyricLineDebugStatus();
    }
}

function nudgeLyricOffset(delta) {
    lyricDebugConfig.offsetSec = clamp(lyricDebugConfig.offsetSec + Number(delta || 0), -120, 120);
    applyLyricTimingAdjustments({ keepCurrent: true });
}

function alignCurrentLyricToPlayback() {
    const audio = musicDriveState.audioEl;
    if (!audio || !Number.isFinite(audio.currentTime) || !lyricState.baseTimeline.length) {
        return;
    }
    const rawIndex = lyricDebugConfig.lineDebugMode && lyricState.debugAnchorIndex >= 0
        ? lyricState.debugAnchorIndex
        : lyricState.currentIndex;
    const activeIndex = clamp(rawIndex, 0, lyricState.baseTimeline.length - 1);
    const baseStart = Number(lyricState.baseTimeline[activeIndex].start || 0);
    lyricDebugConfig.offsetSec = clamp(audio.currentTime - baseStart * lyricDebugConfig.timeScale, -120, 120);
    applyLyricTimingAdjustments({ keepCurrent: true });
    if (lyricDebugConfig.lineDebugMode) {
        const nextIndex = getLyricDebugActiveIndexFromTime(Number(audio.currentTime));
        if (nextIndex >= 0) {
            setLyricDebugAnchor(nextIndex);
        }
        updateLyricLineDebugStatus('歌词调试：已确认当前句');
    }
}

function resetLyricTimingAdjustments() {
    lyricDebugConfig.offsetSec = 0;
    lyricDebugConfig.timeScale = 1;
    applyLyricTimingAdjustments({ keepCurrent: false });
    if (lyricDebugConfig.lineDebugMode) {
        const activeIndex = syncLyricDebugAnchorFromPlayback();
        if (activeIndex >= 0) {
            setLyricDebugAnchor(activeIndex);
        }
        updateLyricLineDebugStatus('歌词调试：已重置时间轴');
    }
}

function exportCurrentAdjustedLyrics() {
    if (!lyricState.timeline.length || !lyricState.activeSongTitle) {
        updateLyricDebugStatus('歌词调试：当前没有可导出的歌词');
        return;
    }
    const title = lyricState.activeSongTitle;
    const body = lyricState.timeline
        .map((item) => `[${formatLyricTimestamp(item.start)}] ${item.text}`)
        .join('\n');
    const content = `《${title}》\n\n${body}\n`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${title}_lyrics_timed.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    updateLyricDebugStatus(`歌词调试：已导出 ${title}`);
}

function stopLyricSync() {
    lyricState.requestToken += 1;
    lyricDebugConfig.lineDebugMode = false;
    lyricState.activeSongTitle = '';
    lyricState.activeKey = '';
    lyricState.lines = [];
    lyricState.baseTimeline = [];
    lyricState.timeline = [];
    lyricState.currentIndex = -1;
    lyricState.debugAnchorIndex = -1;
    lyricState.debugSelectionLocked = false;
    lyricState.animationCursor = 0;
    lyricState.hasExplicitTimestamps = false;
    lyricState.usingFallbackDuration = false;
    lyricState.fallbackDurationSec = 0;
    lyricState.durationSec = 0;
    updateLyricDebugStatus('歌词调试：未加载');
    clearLyricDisplay();
}

function resolveLyricAliasKey(trackKey) {
    const key = normalizeSongKey(trackKey);
    if (!key) {
        return '';
    }
    for (const [from, to] of Object.entries(LYRIC_TRACK_ALIASES)) {
        if (normalizeSongKey(from) === key) {
            return normalizeSongKey(to);
        }
    }
    return key;
}

function resolveLyricsForTrack(trackName, audio) {
    if (!lyricState.library || lyricState.library.size === 0) {
        return null;
    }
    const candidates = [];
    const inputTrack = String(trackName || '').trim();
    if (inputTrack) {
        candidates.push(inputTrack);
    }
    if (audio && audio.src) {
        try {
            const filename = decodeURIComponent(String(audio.src).split('/').pop() || '');
            if (filename) {
                candidates.push(filename);
            }
        } catch (error) {
            // ignore URI decode issues
        }
    }

    for (const candidate of candidates) {
        const key = resolveLyricAliasKey(candidate);
        if (key && lyricState.library.has(key)) {
            return lyricState.library.get(key);
        }
    }

    const keys = Array.from(lyricState.library.keys());
    for (const candidate of candidates) {
        const key = resolveLyricAliasKey(candidate);
        if (!key) {
            continue;
        }
        let best = '';
        for (const sourceKey of keys) {
            if (key.includes(sourceKey) || sourceKey.includes(key)) {
                if (sourceKey.length > best.length) {
                    best = sourceKey;
                }
            }
        }
        if (best) {
            return lyricState.library.get(best);
        }
    }

    return null;
}

function getLyricLineWeight(text) {
    const line = String(text || '');
    const chars = line.replace(/\s+/g, '').length;
    const pauses = (line.match(/[，,。！？!?；;：:、]/g) || []).length;
    return 1 + chars * 0.56 + pauses * 0.52;
}

function buildLyricTimeline(lines, durationSec) {
    const cleanLines = Array.isArray(lines) ? lines.filter(Boolean) : [];
    if (!cleanLines.length) {
        return [];
    }

    const totalLines = cleanLines.length;
    const knownDuration = Number.isFinite(durationSec) && durationSec > 1;
    const safeDuration = knownDuration ? Number(durationSec) : 0;
    const introSec = knownDuration ? clamp(safeDuration * 0.028, 0.55, 2.2) : 0.8;
    const outroSec = knownDuration ? clamp(safeDuration * 0.04, 0.7, 3.0) : 1.2;
    const timelineSpan = knownDuration
        ? Math.max(totalLines * 1.05, safeDuration - introSec - outroSec)
        : Math.max(18, totalLines * 2.25);

    const weights = cleanLines.map((line) => getLyricLineWeight(line));
    const totalWeight = Math.max(0.001, weights.reduce((sum, value) => sum + value, 0));
    const baseDurations = weights.map((weight) => (timelineSpan * weight) / totalWeight);
    const clampedDurations = baseDurations.map((value) => clamp(value, 0.95, 8.8));
    const clampedTotal = Math.max(0.001, clampedDurations.reduce((sum, value) => sum + value, 0));
    const rescale = timelineSpan / clampedTotal;
    const durations = clampedDurations.map((value) => clamp(value * rescale, 0.85, 11.0));

    let cursor = introSec;
    const timeline = [];
    for (let index = 0; index < cleanLines.length; index++) {
        const start = cursor;
        const end = start + durations[index];
        timeline.push({
            index,
            text: cleanLines[index],
            start,
            end
        });
        cursor = end;
    }

    if (knownDuration && timeline.length > 0) {
        const targetEnd = Math.max(introSec + timeline.length * 0.85, safeDuration - outroSec);
        const actualSpan = Math.max(0.01, cursor - introSec);
        const targetSpan = Math.max(0.01, targetEnd - introSec);
        const scale = targetSpan / actualSpan;
        for (const item of timeline) {
            item.start = introSec + (item.start - introSec) * scale;
            item.end = introSec + (item.end - introSec) * scale;
        }
    }

    return timeline;
}

function pickLyricAnimationClass() {
    const effect = String(experienceState.currentEffect || '');
    if (effect === '效果6-矩形闪烁块' || effect === '效果5-柱形均衡波') {
        return 'lyric-anim-impact';
    }
    if (effect === '效果3-扫光') {
        return 'lyric-anim-slide';
    }
    if (effect === '效果4-双轨流色') {
        return 'lyric-anim-bloom';
    }
    const cls = LYRIC_ANIMATION_CLASSES[lyricState.animationCursor % LYRIC_ANIMATION_CLASSES.length];
    lyricState.animationCursor += 1;
    return cls;
}

function applyLyricLine(index) {
    const els = getLyricsOverlayElements();
    if (!els.root || !els.main || !els.next) {
        return;
    }
    const current = lyricState.timeline[index];
    if (!current) {
        clearLyricDisplay();
        return;
    }
    const next = lyricState.timeline[index + 1];
    const animationClass = pickLyricAnimationClass();
    els.main.textContent = current.text;
    els.next.textContent = next ? next.text : '';
    els.main.classList.remove(...LYRIC_ANIMATION_CLASSES);
    // 强制重排，确保每句都触发入场动画
    void els.main.offsetWidth;
    els.main.classList.add(animationClass);
    els.root.classList.add('is-active');
}

async function startLyricSyncForTrack(trackName) {
    const token = lyricState.requestToken + 1;
    lyricState.requestToken = token;
    const ok = await loadLyricsLibrary();
    if (token !== lyricState.requestToken) {
        return;
    }
    if (!ok) {
        updateLyricDebugStatus('歌词调试：歌词文件加载失败');
        stopLyricSync();
        return;
    }
    const audio = musicDriveState.audioEl;
    const section = resolveLyricsForTrack(trackName, audio);
    if (token !== lyricState.requestToken) {
        return;
    }
    if (!section || !section.lines || section.lines.length === 0) {
        updateLyricDebugStatus(`歌词调试：未匹配到 ${trackName || '当前歌曲'} 的歌词`);
        stopLyricSync();
        return;
    }

    const rawDuration = Number(audio && audio.duration);
    const hasDuration = Number.isFinite(rawDuration) && rawDuration > 1;
    const duration = hasDuration ? rawDuration : Math.max(22, section.lines.length * 2.3);

    lyricState.activeSongTitle = section.title;
    lyricState.activeKey = section.key;
    lyricState.lines = section.lines.slice();
    lyricState.currentIndex = -1;
    lyricState.animationCursor = 0;
    lyricState.usingFallbackDuration = !hasDuration;
    lyricState.fallbackDurationSec = duration;
    lyricState.durationSec = duration;
    const timedTimeline = buildTimelineFromTimedLines(section.timedLines, duration);
    lyricState.hasExplicitTimestamps = timedTimeline.length > 0;
    lyricState.baseTimeline = timedTimeline.length > 0
        ? timedTimeline
        : buildLyricTimeline(lyricState.lines, duration);
    lyricState.debugAnchorIndex = -1;
    lyricState.debugSelectionLocked = false;
    lyricDebugConfig.lineDebugMode = false;
    lyricDebugConfig.offsetSec = 0;
    lyricDebugConfig.timeScale = 1;
    applyLyricTimingAdjustments({ keepCurrent: false });
    updateLyricDebugStatus(`歌词调试：已加载 ${section.title}（${lyricState.timeline.length}句）`);
    clearLyricDisplay();
    updateTransportUi();
}

function refreshLyricTimelineIfDurationReady(audio) {
    if (!lyricState.usingFallbackDuration || !audio) {
        return;
    }
    const duration = Number(audio.duration);
    if (!Number.isFinite(duration) || duration <= 1) {
        return;
    }
    if (Math.abs(duration - lyricState.fallbackDurationSec) < 1.2) {
        lyricState.usingFallbackDuration = false;
        lyricState.durationSec = duration;
        return;
    }
    lyricState.durationSec = duration;
    if (!lyricState.hasExplicitTimestamps) {
        lyricState.baseTimeline = buildLyricTimeline(lyricState.lines, duration);
        applyLyricTimingAdjustments({ keepCurrent: true });
    }
    lyricState.usingFallbackDuration = false;
}

function findLyricIndexByTime(timeSec) {
    const timeline = lyricState.timeline;
    if (!timeline.length || !Number.isFinite(timeSec)) {
        return -1;
    }
    const current = lyricState.currentIndex;
    if (current >= 0 && current < timeline.length) {
        const item = timeline[current];
        if (timeSec >= item.start && timeSec < item.end) {
            return current;
        }
    }

    if (timeSec < timeline[0].start) {
        return -1;
    }
    if (timeSec >= timeline[timeline.length - 1].end) {
        return timeline.length - 1;
    }

    let lo = 0;
    let hi = timeline.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const item = timeline[mid];
        if (timeSec < item.start) {
            hi = mid - 1;
        } else if (timeSec >= item.end) {
            lo = mid + 1;
        } else {
            return mid;
        }
    }
    return -1;
}

function updateLyricBeatPulse(now) {
    const els = getLyricsOverlayElements();
    if (!els.root) {
        return;
    }
    const strongAt = Number(musicDriveState.strongBeatAt || 0);
    const strongStrength = clamp(Number(musicDriveState.strongBeatStrength || 0), 0, 1);
    const beatIntervalRaw = musicDriveState.smoothedBeatIntervalMs > 0
        ? musicDriveState.smoothedBeatIntervalMs
        : musicDriveState.beatIntervalMs;
    const beatWindow = clamp(Number(beatIntervalRaw || 520) * 0.22, 70, 180);
    const active = strongAt > 0
        && strongStrength >= 0.55
        && now >= strongAt
        && (now - strongAt) <= beatWindow;
    if (active) {
        els.root.classList.add('is-beat');
    } else {
        els.root.classList.remove('is-beat');
    }
}

function updateLyricSync(now) {
    const lineDebugActive = lyricDebugConfig.lineDebugMode === true;
    if (!experienceState.active || lyricState.timeline.length === 0) {
        return;
    }
    if (!musicDriveState.running && !lineDebugActive) {
        return;
    }
    const audio = musicDriveState.audioEl;
    if (!audio) {
        return;
    }
    if (audio.paused && !lineDebugActive) {
        return;
    }

    refreshLyricTimelineIfDurationReady(audio);
    const timeSec = Number(audio.currentTime);
    if (!Number.isFinite(timeSec) || timeSec < 0) {
        return;
    }

    let nextIndex;
    if (lineDebugActive && audio.paused && lyricState.debugSelectionLocked && lyricState.debugAnchorIndex >= 0) {
        nextIndex = clamp(lyricState.debugAnchorIndex, 0, lyricState.timeline.length - 1);
    } else {
        nextIndex = findLyricIndexByTime(timeSec);
        if (lineDebugActive && nextIndex < 0) {
            nextIndex = getLyricDebugActiveIndexFromTime(timeSec);
        }
    }
    if (nextIndex !== lyricState.currentIndex) {
        lyricState.currentIndex = nextIndex;
        if (lineDebugActive) {
            lyricState.debugAnchorIndex = nextIndex;
            updateLyricLineDebugStatus();
        }
        if (nextIndex < 0) {
            clearLyricDisplay();
            return;
        }
        applyLyricLine(nextIndex);
    }

    if (nextIndex >= 0 && !audio.paused) {
        updateLyricBeatPulse(now);
    } else {
        const els = getLyricsOverlayElements();
        if (els.root) {
            els.root.classList.remove('is-beat');
        }
    }
}

function lerpNumber(current, target, t) {
    return current + (target - current) * clamp(t, 0, 1);
}

function getMusicMetricsSnapshot() {
    const beatIntervalRaw = musicDriveState.smoothedBeatIntervalMs > 0
        ? musicDriveState.smoothedBeatIntervalMs
        : musicDriveState.beatIntervalMs;
    const beatIntervalMs = clamp(Number(beatIntervalRaw || 0), 0, 2200);
    const bpm = beatIntervalMs > 0 ? clamp(60000 / beatIntervalMs, 50, 220) : 0;
    return {
        energy: clamp(Number(musicDriveState.smoothedEnergy || 0), 0, 1),
        low: clamp(Number(musicDriveState.lowBand || 0), 0, 1),
        mid: clamp(Number(musicDriveState.midBand || 0), 0, 1),
        high: clamp(Number(musicDriveState.highBand || 0), 0, 1),
        flux: clamp(Math.max(0, Number(musicDriveState.energyFlux || 0) * 8), 0, 1),
        beatIntervalMs,
        bpm
    };
}

function getMusicColorPresetPool() {
    const names = Object.keys(colorPresets || {});
    if (!names.length) {
        return [];
    }
    const prioritized = MUSIC_COLOR_PRESET_PRIORITY.filter((name) => names.includes(name) && !isGrayMetalThemeName(name));
    const extras = names.filter((name) => !prioritized.includes(name) && !isGrayMetalThemeName(name));
    const pool = [...prioritized, ...extras];
    if (pool.length > 0) {
        return pool;
    }
    return names.filter((name) => name !== '金属灰翻转金色');
}

function getColorPresetScore(name, metrics) {
    const theme = String(name || '');
    const fast = metrics.bpm >= 130;
    const warmBias = metrics.energy * 0.45 + metrics.low * 0.35 + metrics.flux * 0.2;
    const coolBias = metrics.high * 0.45 + (1 - metrics.low) * 0.15 + (1 - metrics.energy) * 0.2 + metrics.mid * 0.2;

    if (theme === '春节纯洁红') {
        return warmBias + (fast ? 0.3 : 0.08);
    }
    if (theme === '暮色玫瑰铜') {
        return warmBias + metrics.flux * 0.18 + (fast ? 0.22 : 0);
    }
    if (theme === '翡翠鎏金') {
        return metrics.mid * 0.45 + metrics.low * 0.2 + (1 - metrics.flux) * 0.2 + 0.12;
    }
    if (theme === '钛蓝冷光') {
        return coolBias + metrics.high * 0.18 + (fast ? 0.06 : 0.16);
    }
    return metrics.energy * 0.35 + metrics.mid * 0.25 + metrics.high * 0.2;
}

function getCameraModeCandidates(effect) {
    if (effect === '效果3-扫光') {
        return ['pedestal', 'arc', 'diagonal'];
    }
    if (effect === '效果5-柱形均衡波') {
        return ['pushpull', 'truck', 'diagonal'];
    }
    if (effect === '效果4-双轨流色') {
        return ['truck', 'diagonal', 'arc'];
    }
    if (effect === '效果2-行内波') {
        return ['diagonal', 'truck', 'pedestal'];
    }
    if (effect === '效果6-矩形闪烁块') {
        return ['pushpull', 'diagonal'];
    }
    return ['arc', 'truck', 'pedestal'];
}

function selectCameraMoveMode(effect, metrics) {
    const candidates = getCameraModeCandidates(effect);
    if (!candidates.length) {
        return 'arc';
    }
    const offset = metrics.energy >= 0.66 ? 1 : 0;
    let idx = (experienceState.cameraMoveCycle + offset) % candidates.length;
    let mode = candidates[idx];
    if (mode === experienceState.cameraMoveMode && candidates.length > 1) {
        idx = (idx + 1) % candidates.length;
        mode = candidates[idx];
    }
    experienceState.cameraMoveCycle += 1;
    return mode;
}

function maybeShiftMusicColorPreset(metrics, now) {
    if (!experienceState.autoOrchestration) {
        return;
    }
    if (now < experienceState.nextColorShiftAt) {
        return;
    }

    const pool = experienceState.colorPresetPool && experienceState.colorPresetPool.length
        ? experienceState.colorPresetPool
        : getMusicColorPresetPool();
    experienceState.colorPresetPool = pool;
    if (!pool.length) {
        return;
    }

    const current = String(presetState.theme || '');
    let bestName = '';
    let bestScore = -Infinity;
    for (const name of pool) {
        if (name === current) {
            continue;
        }
        let score = getColorPresetScore(name, metrics);
        const recentlyUsed = experienceState.colorHistory.slice(-2).includes(name);
        if (recentlyUsed) {
            score -= 0.18;
        }
        if (score > bestScore) {
            bestScore = score;
            bestName = name;
        }
    }

    if (!bestName) {
        bestName = pool.find((name) => name !== current) || '';
    }
    if (!bestName || !colorPresets[bestName]) {
        return;
    }

    applyPreset(bestName, { transition: PRESET_TRANSITION_MODES.BLEND });
    experienceState.colorHistory.push(bestName);
    if (experienceState.colorHistory.length > 8) {
        experienceState.colorHistory.shift();
    }
    const beatMs = metrics.beatIntervalMs > 0 ? metrics.beatIntervalMs : 560;
    const holdMs = clamp(Math.round(beatMs * (20 + (1 - metrics.energy) * 10)), 9000, 24000);
    experienceState.lastColorShiftAt = now;
    experienceState.nextColorShiftAt = now + holdMs;
}

function shouldUseFlashBurst(metrics, now) {
    if (now < experienceState.flashBurstUntil) {
        return true;
    }
    const fastSection = metrics.bpm >= 122 && metrics.energy >= 0.42;
    if (!fastSection) {
        return false;
    }
    if (now < experienceState.flashCooldownUntil) {
        return false;
    }

    const chance = clamp(0.1 + metrics.flux * 0.26 + (metrics.bpm >= 138 ? 0.08 : 0), 0.08, 0.34);
    if (Math.random() > chance) {
        return false;
    }

    const beatMs = metrics.beatIntervalMs > 0 ? metrics.beatIntervalMs : 520;
    const burstMs = clamp(Math.round(beatMs * (2.6 + metrics.flux * 2.8)), 900, 2600);
    const cooldownMs = clamp(Math.round(beatMs * (14 + (1 - metrics.energy) * 8)), 6200, 18000);
    experienceState.flashBurstUntil = now + burstMs;
    experienceState.flashCooldownUntil = experienceState.flashBurstUntil + cooldownMs;
    return true;
}

function chooseNextEffectByMusic(metrics, now) {
    if (shouldUseFlashBurst(metrics, now)) {
        return '效果6-矩形闪烁块';
    }

    const energy = metrics.energy;
    const low = metrics.low;
    const mid = metrics.mid;
    const high = metrics.high;
    const flux = metrics.flux;
    const bpmNorm = metrics.bpm > 0 ? clamp((metrics.bpm - 70) / 90, 0, 1) : 0.45;

    const scores = {
        '效果1-行波': (1 - bpmNorm) * 0.7 + (mid * 0.5 + energy * 0.26),
        '效果2-行内波': bpmNorm * 0.6 + (mid * 0.46 + high * 0.36 + flux * 0.24),
        '效果3-扫光': low * 0.86 + flux * 0.55 + bpmNorm * 0.26,
        '效果4-双轨流色': mid * 0.78 + (1 - Math.abs(low - high)) * 0.48 + energy * 0.24,
        '效果5-柱形均衡波': high * 0.85 + flux * 0.76 + energy * 0.4
    };

    const recentHistory = experienceState.effectHistory.slice(-AUTO_EFFECT_RECENT_WINDOW);
    const usageCount = Object.create(null);
    for (const effect of recentHistory) {
        usageCount[effect] = (usageCount[effect] || 0) + 1;
    }
    const lastEffect = String(experienceState.effectHistory[experienceState.effectHistory.length - 1] || '');
    const recent = new Set(experienceState.effectHistory.slice(-2));
    let bestEffect = WAVE_EFFECTS[0];
    let bestScore = -Infinity;

    for (const effect of WAVE_EFFECTS) {
        if (effect === '效果6-矩形闪烁块') {
            continue;
        }
        let score = scores[effect] || 0;
        if (recent.has(effect)) {
            score -= effect === '效果1-行波' ? 0.32 : 0.3;
        }
        if (effect === lastEffect) {
            score -= 0.2;
        }
        if (recentHistory.length > 0) {
            const share = (usageCount[effect] || 0) / recentHistory.length;
            const targetShare = AUTO_EFFECT_TARGET_SHARE[effect] || 0.2;
            const overflow = Math.max(0, share - targetShare);
            const underflow = Math.max(0, targetShare - share);
            if (overflow > 0) {
                score -= overflow * (effect === '效果1-行波' ? 1.4 : 1.35);
            } else if (underflow > 0) {
                score += underflow * 0.22;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestEffect = effect;
        }
    }
    return bestEffect;
}

function tuneEffectWithMusic(effect, metrics) {
    const energy = metrics.energy;
    const flux = metrics.flux;
    const low = metrics.low;
    const high = metrics.high;
    const beatMs = metrics.beatIntervalMs > 0 ? metrics.beatIntervalMs : 560;

    springWaveConfig.musicSyncAllEffects = true;
    springWaveConfig.musicSyncMode = metrics.bpm > 0 ? '节拍优先' : '跟随音频能量';
    springWaveConfig.musicSyncStrength = clamp(0.64 + energy * 0.3, 0.55, 0.97);
    springWaveConfig.musicSyncBeatPulse = clamp(0.22 + flux * 0.5, 0.18, 0.9);
    springWaveConfig.musicSyncMinMs = clamp(Math.round(24 + (1 - energy) * 64), 20, 180);
    springWaveConfig.musicSyncMaxMs = clamp(Math.round(180 + (1 - energy) * 320), 120, 900);
    springWaveConfig.damping = clamp(0.08 + energy * 0.12, 0.06, 0.23);
    springWaveConfig.direction = low >= high ? '从下到上' : '从上到下';
    springWaveConfig.innerDirection = high >= low ? '从左到右' : '从右到左';

    if (effect === '效果1-行波' || effect === '效果2-行内波') {
        springWaveConfig.rowIntervalMs = clamp(Math.round(beatMs * (0.26 + (1 - energy) * 0.32)), 26, 280);
        springWaveConfig.stagePauseMs = clamp(Math.round(50 + (1 - energy) * 210), 40, 280);
        springWaveConfig.innerDelayMs = clamp(Math.round(6 + (1 - energy) * 22), 4, 36);
    } else if (effect === '效果3-扫光') {
        sweepLightConfig.intensity = clamp(2.8 + energy * 8.6 + flux * 1.5, 2, 12);
        sweepLightConfig.durationMs = clamp(Math.round(beatMs * (2.9 - energy * 1.1)), 800, 5200);
        sweepLightConfig.spanScale = clamp(0.92 + high * 0.92, 0.8, 1.95);
        sweepLightConfig.edgeAttenuation = clamp(0.35 - energy * 0.18, 0.08, 0.42);
        sweepLightConfig.xOffset = clamp((high - low) * 8, -8, 8);
        updateSweepLightParams();
    } else if (effect === '效果4-双轨流色') {
        springWaveConfig.flowRenderMode = DUAL_TRACK_FLOW_MODE_FLIP;
        springWaveConfig.flowStepMs = clamp(Math.round(beatMs * (0.24 + (1 - energy) * 0.1)), 30, 220);
        springWaveConfig.flowCycles = clamp(Math.round(2 + energy * 6), 2, 9);
        springWaveConfig.flowBandSize = clamp(Math.round(1 + flux * 3), 1, 4);
        springWaveConfig.outerFace = low > high ? 1 : 2;
        springWaveConfig.innerBaseFace = springWaveConfig.outerFace === 1 ? 2 : 1;
        springWaveConfig.innerFlowFace = high > 0.48 ? 0 : 1;
    } else if (effect === '效果5-柱形均衡波') {
        springWaveConfig.equalizerDrive = metrics.bpm > 0 ? '音频频段' : '随机波动';
        springWaveConfig.equalizerBars = clamp(Math.round(18 + high * 26), 14, 56);
        springWaveConfig.equalizerUpdateMs = clamp(Math.round(beatMs * 0.23), 42, 170);
        springWaveConfig.equalizerBodyMotion = clamp(0.22 + energy * 0.5, 0.2, 0.86);
        springWaveConfig.equalizerRandomness = clamp(0.05 + (1 - energy) * 0.25, 0.04, 0.34);
        springWaveConfig.equalizerAudioGain = clamp(1.12 + high * 1.58, 1, 2.8);
        springWaveConfig.equalizerFluxGain = clamp(1.25 + flux * 3.4, 0.5, 5.2);
    } else if (effect === '效果6-矩形闪烁块') {
        springWaveConfig.mosaicTempoSync = '节拍优先';
        springWaveConfig.mosaicSyncStrength = clamp(0.56 + flux * 0.26, 0.5, 0.82);
        springWaveConfig.mosaicUpdateMs = clamp(Math.round(beatMs * (0.4 + (1 - energy) * 0.22)), 90, 320);
        springWaveConfig.mosaicRebuildMs = clamp(Math.round(2100 + (1 - energy) * 2600), 1500, 6200);
        springWaveConfig.mosaicActivationRate = clamp(0.12 + energy * 0.32, 0.1, 0.5);
        springWaveConfig.mosaicDecayRate = clamp(0.08 + flux * 0.3, 0.07, 0.42);
        springWaveConfig.mosaicSwapRate = clamp(0.04 + high * 0.22, 0.04, 0.34);
        springWaveConfig.mosaicHorizontalBias = clamp(0.45 + (high - low) * 0.35, 0.12, 0.88);
    }
}

function setCinematicCameraTarget(effect, metrics, now, effectChanged = true) {
    const energy = metrics.energy;
    const flux = metrics.flux;
    const beatMs = metrics.beatIntervalMs > 0 ? metrics.beatIntervalMs : 560;
    const tempo = clamp(60000 / beatMs, 60, 180);
    const tempoNorm = clamp((tempo - 70) / 95, 0, 1);
    const yawLimit = clamp(Number(experienceState.cameraYawLimit || 0.72), 0.35, 0.95);
    const yawStep = clamp(0.18 + tempoNorm * 0.12 + flux * 0.12, 0.14, 0.42);
    let nextYaw = experienceState.cameraAnchorYaw + yawStep * experienceState.cameraOrbitDirection;
    if (nextYaw > yawLimit) {
        nextYaw = yawLimit;
        experienceState.cameraOrbitDirection = -1;
    } else if (nextYaw < -yawLimit) {
        nextYaw = -yawLimit;
        experienceState.cameraOrbitDirection = 1;
    }
    experienceState.cameraAnchorYaw = nextYaw;

    const next = { ...experienceState.cameraTarget };
    const shouldSwitchMode = effectChanged || now >= Number(experienceState.cameraModeSwitchAt || 0);
    if (shouldSwitchMode) {
        experienceState.cameraMoveMode = selectCameraMoveMode(effect, metrics);
        const modeHoldMs = clamp(Math.round(beatMs * (14 + (1 - energy) * 8)), 6800, 18000);
        experienceState.cameraModeSwitchAt = now + modeHoldMs;
    }
    const nextFovBase = effect === '效果6-矩形闪烁块' ? 35 : 32;
    const effectFov = clamp(
        nextFovBase
        - energy * (effect === '效果3-扫光' ? 2.4 : 1.8)
        - flux * (effect === '效果3-扫光' ? 1.2 : 0.6),
        24,
        38
    );
    const baseRadius = getPreferredWallCameraRadius(effectFov);
    const safeMin = baseRadius * 1.02;
    const safeMax = baseRadius * 1.3;

    next.fov = effectFov;
    if (effect === '效果1-行波') {
        next.radius = clamp(baseRadius * (1.12 - energy * 0.04), safeMin, safeMax);
        next.height = clamp(0.6 + energy * 2.4, -1, 4.6);
        next.sway = 0.45;
    } else if (effect === '效果2-行内波') {
        next.radius = clamp(baseRadius * (1.08 - energy * 0.03), safeMin, safeMax);
        next.height = clamp(1.2 + flux * 2.3, -1, 4.8);
        next.sway = 0.62;
    } else if (effect === '效果3-扫光') {
        next.radius = clamp(baseRadius * (1.04 - energy * 0.02), safeMin, safeMax);
        next.height = clamp(2.2 + flux * 2.2, 0, 5.2);
        next.sway = 1.02;
    } else if (effect === '效果4-双轨流色') {
        next.radius = clamp(baseRadius * (1.1 - energy * 0.03), safeMin, safeMax);
        next.height = clamp(0.5 + (metrics.mid - metrics.low) * 2.5, -2, 4.2);
        next.sway = 0.78;
    } else if (effect === '效果5-柱形均衡波') {
        next.radius = clamp(baseRadius * (1.06 - energy * 0.02), safeMin, safeMax);
        next.height = clamp(1 + metrics.high * 3.4, -1, 5.6);
        next.sway = 0.72;
    } else {
        next.radius = clamp(baseRadius * (1.16 - energy * 0.04), safeMin, safeMax);
        next.height = clamp(3.4 + (1 - energy) * 2.6, 2.2, 6.4);
        next.sway = 0.38;
    }
    next.yaw = experienceState.cameraAnchorYaw;
    const swayCap = Math.max(0.14, yawLimit - Math.abs(next.yaw) - 0.06);
    next.sway = Math.min(next.sway, swayCap);
    experienceState.cameraTarget = next;
}

function switchEffectByMusic(now) {
    const metrics = getMusicMetricsSnapshot();
    maybeShiftMusicColorPreset(metrics, now);
    const effect = chooseNextEffectByMusic(metrics, now);
    const previousEffect = String(experienceState.currentEffect || '');
    const effectChanged = previousEffect !== effect;
    tuneEffectWithMusic(effect, metrics);
    applySpringEffectSelection(effect, { restart: true, forceRestart: true });
    experienceState.effectHistory.push(effect);
    if (experienceState.effectHistory.length > 12) {
        experienceState.effectHistory.shift();
    }
    setCinematicCameraTarget(effect, metrics, now, effectChanged);

    const beatMs = metrics.beatIntervalMs > 0 ? metrics.beatIntervalMs : 560;
    let holdMs;
    if (effect === '效果6-矩形闪烁块') {
        const burstRemaining = Math.max(10000, experienceState.flashBurstUntil - now);
        holdMs = clamp(Math.round(burstRemaining), 10000, 18000);
    } else {
        const stageBeats = clamp(Math.round(10 + (1 - metrics.energy) * 10 + metrics.flux * 4), 8, 22);
        holdMs = clamp(Math.round(beatMs * stageBeats), 3800, 16000);
    }
    experienceState.nextEffectSwitchAt = now + holdMs;
    updateExperienceStatus(`正在播放：${experienceState.trackName || '当前音乐'} ｜ ${effect} ｜ 配色 ${presetState.theme}`);
}

function stopMusicOrchestration() {
    experienceState.active = false;
    experienceState.autoOrchestration = false;
    experienceState.currentEffect = '';
    experienceState.nextEffectSwitchAt = 0;
    experienceState.effectHistory = [];
    experienceState.colorHistory = [];
    experienceState.flashBurstUntil = 0;
    experienceState.flashCooldownUntil = 0;
    experienceState.colorPresetPool = [];
    experienceState.nextColorShiftAt = 0;
    experienceState.lastColorShiftAt = 0;
    experienceState.cameraMoveMode = 'arc';
    experienceState.cameraModeSwitchAt = 0;
    experienceState.cameraMoveCycle = 0;
    experienceState.cameraKickStyle = 'smooth';
    experienceState.cameraKickEnvelope = 0;
    experienceState.cameraStutterUntil = 0;
    experienceState.cameraLastStrongBeatAt = 0;
    stopLyricSync();
}

async function startMusicExperience(trackName = '') {
    experienceState.trackName = String(trackName || '音乐');
    sceneModeConfig.mode = '春晚模式';
    applySceneMode();
    setPanelVisible(false);
    updateExperienceStatus(`正在启动：${experienceState.trackName}`);

    experienceState.colorPresetPool = getMusicColorPresetPool();
    if (isGrayMetalThemeName(presetState.theme)) {
        const openingTheme = experienceState.colorPresetPool[0] || resolvePreferredPresetFallback();
        if (openingTheme && colorPresets[openingTheme]) {
            applyPreset(openingTheme, { transition: PRESET_TRANSITION_MODES.BLEND });
        }
    }

    musicDriveConfig.autoTrigger = false;
    musicDriveConfig.autoPlayAfterLoad = false;

    await startMusicDrive();
    if (!musicDriveState.running) {
        updateExperienceStatus('启动失败，请更换音频文件重试');
        return;
    }

    applyWallOverviewCamera({ fov: Math.min(config.camFov, 32) });
    const baseRadius = getPreferredWallCameraRadius(config.camFov);
    experienceState.cameraPose.radius = baseRadius * 1.12;
    experienceState.cameraTarget.radius = baseRadius * 1.12;
    experienceState.cameraPose.fov = config.camFov;
    experienceState.cameraTarget.fov = config.camFov;
    experienceState.active = true;
    experienceState.autoOrchestration = true;
    springWaveConfig.flowRenderMode = DUAL_TRACK_FLOW_MODE_FLIP;
    experienceState.currentEffect = '';
    experienceState.startedAt = performance.now();
    experienceState.nextEffectSwitchAt = 0;
    experienceState.cameraAnchorYaw = 0;
    experienceState.cameraOrbitDirection = 1;
    experienceState.cameraMoveMode = 'arc';
    experienceState.cameraModeSwitchAt = 0;
    experienceState.cameraMoveCycle = 0;
    experienceState.cameraKickStyle = 'smooth';
    experienceState.cameraKickEnvelope = 0;
    experienceState.cameraStutterUntil = 0;
    experienceState.cameraLastStrongBeatAt = 0;
    experienceState.flashBurstUntil = 0;
    experienceState.flashCooldownUntil = 0;
    experienceState.effectHistory = [];
    experienceState.colorHistory = [presetState.theme];
    experienceState.lastColorShiftAt = performance.now();
    experienceState.nextColorShiftAt = experienceState.lastColorShiftAt + 11000;
    setExperienceUiPlaying(true);
    updateExperienceStatus(`正在播放：${experienceState.trackName} ｜ 配色 ${presetState.theme}`);
    void startLyricSyncForTrack(experienceState.trackName);
    updateTransportUi();
}

function updateMusicOrchestration(now) {
    if (!experienceState.autoOrchestration || !musicDriveState.running) {
        return;
    }
    if (springWaveConfig.flowRenderMode !== DUAL_TRACK_FLOW_MODE_FLIP) {
        springWaveConfig.flowRenderMode = DUAL_TRACK_FLOW_MODE_FLIP;
        if (guiPanel) {
            updateGuiFolderDisplay(guiPanel);
        }
    }
    const audio = musicDriveState.audioEl;
    if (!audio || audio.paused) {
        return;
    }

    if (experienceState.nextEffectSwitchAt <= 0 || now >= experienceState.nextEffectSwitchAt) {
        switchEffectByMusic(now);
    }
}

function getStrongKickPulse(now, beatMs) {
    const strongAt = Number(musicDriveState.strongBeatAt || 0);
    const strength = clamp(Number(musicDriveState.strongBeatStrength || 0), 0, 1);
    if (!strongAt || strength <= 0.01) {
        return 0;
    }
    const age = now - strongAt;
    if (age < 0) {
        return 0;
    }
    const windowMs = clamp(beatMs * 0.32, 70, 240);
    return clamp(1 - age / windowMs, 0, 1) * strength;
}

function updateCinematicCamera(now) {
    if (!experienceState.active || !controls || !camera) {
        return;
    }
    if (isCameraInteracting) {
        return;
    }

    const center = activeWallBounds || { centerX: 0, centerY: 0, width: 16, height: 12 };
    const beatInterval = musicDriveState.smoothedBeatIntervalMs > 0
        ? musicDriveState.smoothedBeatIntervalMs
        : musicDriveState.beatIntervalMs;
    const safeBeat = clamp(Number(beatInterval || 560), 300, 1400);
    const energy = clamp(Number(musicDriveState.smoothedEnergy || 0), 0, 1);
    const strongBeatAt = Number(musicDriveState.strongBeatAt || 0);
    if (strongBeatAt > experienceState.cameraLastStrongBeatAt) {
        experienceState.cameraLastStrongBeatAt = strongBeatAt;
        const strongStrength = clamp(Number(musicDriveState.strongBeatStrength || 0), 0, 1);
        const allowStutter = strongStrength >= 0.58 && Math.random() < 0.2;
        experienceState.cameraKickStyle = allowStutter ? 'stutter' : 'smooth';
        experienceState.cameraStutterUntil = allowStutter
            ? now + clamp(safeBeat * 0.24, 90, 260)
            : 0;
    }
    const strongKickRaw = getStrongKickPulse(now, safeBeat);
    const kickLerp = strongKickRaw > experienceState.cameraKickEnvelope ? 0.34 : 0.12;
    experienceState.cameraKickEnvelope = lerpNumber(experienceState.cameraKickEnvelope, strongKickRaw, kickLerp);
    let strongKickPulse = experienceState.cameraKickEnvelope;
    if (experienceState.cameraKickStyle === 'stutter' && now < experienceState.cameraStutterUntil) {
        strongKickPulse = Math.round(strongKickPulse * 5) / 5;
    } else {
        strongKickPulse = strongKickPulse * strongKickPulse * (3 - 2 * strongKickPulse);
    }

    experienceState.cameraPose.yaw = lerpNumber(experienceState.cameraPose.yaw, experienceState.cameraTarget.yaw, 0.025);
    experienceState.cameraPose.radius = lerpNumber(experienceState.cameraPose.radius, experienceState.cameraTarget.radius, 0.035);
    experienceState.cameraPose.height = lerpNumber(experienceState.cameraPose.height, experienceState.cameraTarget.height, 0.03);
    experienceState.cameraPose.fov = lerpNumber(experienceState.cameraPose.fov, experienceState.cameraTarget.fov, 0.02);
    experienceState.cameraPose.sway = lerpNumber(experienceState.cameraPose.sway, experienceState.cameraTarget.sway, 0.03);

    const elapsed = now - experienceState.startedAt;
    const yawLimit = clamp(Number(experienceState.cameraYawLimit || 0.72), 0.35, 0.95);
    const swayCap = Math.max(0.1, yawLimit - Math.abs(experienceState.cameraPose.yaw) - 0.04);
    const sway = Math.min(experienceState.cameraPose.sway, swayCap);
    const orbitAngle = clamp(
        experienceState.cameraPose.yaw + Math.sin(elapsed * 0.00042) * sway,
        -yawLimit,
        yawLimit
    );
    const mode = experienceState.cameraMoveMode || 'arc';
    const tempoNorm = clamp((60000 / safeBeat - 70) / 95, 0, 1);
    const phaseA = elapsed * (0.00036 + tempoNorm * 0.00018);
    const phaseB = elapsed * (0.00062 + tempoNorm * 0.00026);
    const lateralAmp = clamp(center.width * (0.042 + energy * 0.048), 0.8, 3.8);
    const verticalAmp = clamp(center.height * (0.036 + energy * 0.052), 0.7, 4.0);

    let truckOffset = 0;
    let pedestalOffset = 0;
    let dollyOffset = 0;
    let frontOffset = 0;
    let orbitMix = 1.0;
    if (mode === 'truck') {
        truckOffset = Math.sin(phaseA) * lateralAmp * 1.1;
        pedestalOffset = Math.sin(phaseB * 0.5) * verticalAmp * 0.22;
    } else if (mode === 'pedestal') {
        truckOffset = Math.sin(phaseB * 0.4) * lateralAmp * 0.35;
        pedestalOffset = Math.sin(phaseA * 1.04) * verticalAmp * 1.02;
    } else if (mode === 'diagonal') {
        truckOffset = Math.sin(phaseA) * lateralAmp * 0.82;
        pedestalOffset = Math.cos(phaseA * 1.08) * verticalAmp * 0.78;
    } else if (mode === 'pushpull') {
        dollyOffset = Math.sin(phaseA * 0.88) * (1.1 + energy * 1.8);
        truckOffset = Math.sin(phaseB * 0.42) * lateralAmp * 0.28;
        pedestalOffset = Math.sin(phaseB * 0.66) * verticalAmp * 0.32;
        frontOffset = Math.cos(phaseA * 0.6) * 0.65;
        orbitMix = 0.7;
    } else {
        truckOffset = Math.sin(phaseB * 0.43) * lateralAmp * 0.26;
        pedestalOffset = Math.sin(phaseA * 0.84 + orbitAngle * 0.4) * verticalAmp * 0.28;
    }

    const orbitRadiusBase = Math.max(18, experienceState.cameraPose.radius + dollyOffset);
    const kickAge = strongBeatAt > 0 ? Math.max(0, now - strongBeatAt) : 9999;
    const kickWindow = clamp(safeBeat * 0.52, 140, 460);
    const kickT = clamp(kickAge / kickWindow, 0, 1);
    const kickPull = strongKickPulse * (0.26 + energy * 0.36);
    const kickRebound = strongKickPulse * Math.sin(kickT * Math.PI) * (0.12 + energy * 0.24) * (1 - kickT);
    const orbitRadius = Math.max(18, orbitRadiusBase - kickPull + kickRebound);
    const orbitX = center.centerX + Math.sin(orbitAngle) * orbitRadius * orbitMix;
    const orbitZ = Math.cos(orbitAngle) * orbitRadius;
    const minFrontZ = getPreferredWallCameraRadius(experienceState.cameraPose.fov) * 0.72;
    const x = orbitX + truckOffset;
    const z = Math.max(minFrontZ, orbitZ + frontOffset);
    const yBase = center.centerY + experienceState.cameraPose.height;
    const y = yBase + pedestalOffset + strongKickPulse * (0.08 + musicDriveState.lowBand * 0.2);
    const targetX = center.centerX + truckOffset * 0.22;
    const targetY = center.centerY + pedestalOffset * 0.18 + Math.sin(phaseB * 0.58) * 0.12;

    camera.position.set(x, y, z);
    controls.target.set(targetX, targetY, 0);
    camera.fov = clamp(experienceState.cameraPose.fov - strongKickPulse * 0.46 + kickRebound * 0.2, 20, 45);
    camera.updateProjectionMatrix();
}

function initGUI() {
    if (typeof dat === 'undefined' || !dat.GUI) {
        console.warn('dat.GUI 未加载，跳过控制面板初始化');
        return;
    }

    const gui = new dat.GUI({ autoPlace: false, width: 330 });
    guiPanel = gui;
    const guiContainer = document.getElementById('gui-container');
    if (guiContainer) {
        guiContainer.innerHTML = '';
        guiContainer.appendChild(gui.domElement);
    } else {
        document.body.appendChild(gui.domElement);
    }
    gui.domElement.style.position = 'static';
    gui.domElement.style.top = '0';
    gui.domElement.style.right = '0';
    gui.domElement.style.zIndex = '9999';
    gui.domElement.style.pointerEvents = 'auto';

    const modeFolder = gui.addFolder('场景模式');
    modeFolder.add(sceneModeConfig, 'mode', ['展示模式', '自由模式', '春晚模式']).name('模式').onChange(() => {
        applySceneMode();
    });
    modeFolder.add(sceneModeConfig, 'springAutoResize').name('春晚自动扩墙');
    modeFolder.add(sceneModeConfig, 'springRows', 12, 80).step(1).name('春晚建议纵向');
    modeFolder.add(sceneModeConfig, 'springCols', 20, 140).step(1).name('春晚建议横向');
    modeFolder.add(sceneModeConfig, 'strokePixels', 1, 4).step(1).name('布局缩放').onFinishChange(() => {
        if (isSpringFestivalMode()) {
            applySceneMode();
        }
    });
    modeFolder.add({ applyMode: () => applySceneMode() }, 'applyMode').name('应用模式');
    modeFolder.open();

    const presetFolder = gui.addFolder('配色模板');
    const presetOptions = Object.keys(colorPresets);
    presetFolder.add(presetState, 'theme', presetOptions).name('模板').onChange((value) => {
        applyPreset(value, { transition: PRESET_TRANSITION_MODES.FLIP });
    });
    presetFolder.add({ applyNow: () => applyPreset(presetState.theme, { transition: PRESET_TRANSITION_MODES.FLIP }) }, 'applyNow').name('一键应用');
    presetFolder.add({ saveCurrent: () => saveCurrentPreset() }, 'saveCurrent').name('保存更改');
    presetFolder.add({ restoreDefault: () => restoreCurrentPresetDefault() }, 'restoreDefault').name('恢复默认');
    presetFolder.open();

    const playbackFolder = gui.addFolder('文字播放');
    playbackFolder.add(displayConfig, 'sequence').name('序列(|分隔)').onFinishChange((value) => {
        displayConfig.sequence = String(value || '');
        if (isDisplayMode()) {
            previewCurrentSequenceText().catch(console.error);
        }
    });
    playbackFolder.add(displayConfig, 'intervalMs', 200, 5000).step(50).name('切换间隔(ms)');
    playbackFolder.add(displayConfig, 'onFace', { 面1: 1, 面2: 2 }).name('显示面');
    playbackFolder.add(displayConfig, 'compactCols', 4, 40).step(1).name('紧凑列宽');
    playbackFolder.add(displayConfig, 'autoExpand').name('自动扩展行列');
    playbackFolder.add(displayConfig, 'autoExpandMaxRows', 24, 180).step(1).name('自动扩展最大行');
    playbackFolder.add(displayConfig, 'autoExpandMaxCols', 40, 360).step(1).name('自动扩展最大列');
    playbackFolder.add(displayConfig, 'threshold', 20, 240).step(1).name('阈值');
    playbackFolder.add(displayConfig, 'textScale', 0.35, 1.0).step(0.01).name('字体缩放');
    playbackFolder.add(displayConfig, 'bold').name('粗体');
    playbackFolder.add(displayConfig, 'loop').name('循环播放');
    const cjkFolder = playbackFolder.addFolder('中文紧凑');
    cjkFolder.add(displayConfig, 'cjkTargetRows', 12, 40).step(1).name('中文目标行高');
    cjkFolder.add(displayConfig, 'cjkWidthEstimate', 3.5, 9.0).step(0.1).name('中文估算宽');
    cjkFolder.add(displayConfig, 'cjkGapCells', 0.0, 2.5).step(0.1).name('中文估算字距');
    cjkFolder.add(displayConfig, 'cjkAdvanceRatio', 0.45, 1.0).step(0.01).name('中文单字宽比');
    cjkFolder.add(displayConfig, 'cjkTrackingRatio', 0.0, 0.3).step(0.01).name('中文字间距比');
    cjkFolder.add(displayConfig, 'cjkEdgeThreshold', 60, 220).step(1).name('中文边缘阈值');
    cjkFolder.add(displayConfig, 'cjkFillRatio', 0.01, 0.5).step(0.01).name('中文像素占比阈值');
    cjkFolder.add(displayConfig, 'cjkThinPasses', 0, 6).step(1).name('中文骨架化轮次');
    playbackFolder.add({ previewFirst: () => previewCurrentSequenceText().catch(console.error) }, 'previewFirst').name('预览首项');
    playbackFolder.add({ playNow: () => { startPlayback(); } }, 'playNow').name('一键播放');
    playbackFolder.add({ stopNow: () => stopPlayback({ resetPose: true }) }, 'stopNow').name('停止播放');
    guiRefs.playbackFolder = playbackFolder;

    const springWaveFolder = gui.addFolder('春晚行波');
    springWaveFolder.add(springWaveConfig, 'effect', ['效果1-行波', '效果2-行内波', '效果3-扫光', '效果4-双轨流色', '效果5-柱形均衡波', '效果6-矩形闪烁块']).name('播放效果').onChange((value) => {
        applySpringEffectSelection(value, { restart: isSpringFestivalMode(), forceRestart: true });
    });
    springWaveFolder.add(springWaveConfig, 'direction', ['从上到下', '从下到上']).name('行进方向');
    springWaveFolder.add(springWaveConfig, 'rowIntervalMs', 0, 800).step(10).name('行波延迟(ms)');
    springWaveFolder.add(springWaveConfig, 'stagePauseMs', 0, 600).step(10).name('2面后停顿(ms)');
    springWaveFolder.add(springWaveConfig, 'innerDelayMs', 0, 80).step(1).name('行内延迟(ms)');
    springWaveFolder.add(springWaveConfig, 'innerDirection', ['从左到右', '从右到左']).name('行内方向');
    springWaveFolder.add(springWaveConfig, 'damping', 0.04, 0.25).step(0.005).name('阻尼系数');
    const globalSyncFolder = springWaveFolder.addFolder('全效果音乐联动');
    globalSyncFolder.add(springWaveConfig, 'musicSyncAllEffects').name('启用全效果联动');
    globalSyncFolder.add(springWaveConfig, 'musicSyncMode', ['关闭', '跟随音频能量', '节拍优先']).name('联动模式');
    globalSyncFolder.add(springWaveConfig, 'musicSyncStrength', 0, 1).step(0.01).name('联动强度');
    globalSyncFolder.add(springWaveConfig, 'musicSyncMinMs', 20, 260).step(1).name('联动最快(ms)');
    globalSyncFolder.add(springWaveConfig, 'musicSyncMaxMs', 60, 900).step(1).name('联动最慢(ms)');
    globalSyncFolder.add(springWaveConfig, 'musicSyncBeatPulse', 0, 1).step(0.01).name('拍点冲击');
    const dualTrackFolder = springWaveFolder.addFolder('效果4 双轨流色');
    dualTrackFolder.add(springWaveConfig, 'outerFace', { 面1: 1, 面2: 2 }).name('外侧颜色面');
    dualTrackFolder.add(springWaveConfig, 'innerBaseFace', { 面1: 1, 面2: 2 }).name('中间基础面');
    dualTrackFolder.add(springWaveConfig, 'innerFlowFace', { 面0: 0, 面1: 1, 面2: 2 }).name('中间流动面');
    dualTrackFolder.addColor(springWaveConfig, 'outerTrackColor').name('外轨颜色');
    dualTrackFolder.addColor(springWaveConfig, 'innerBaseColor').name('中间基础色');
    dualTrackFolder.addColor(springWaveConfig, 'innerFlowColor').name('中间流动色');
    dualTrackFolder.add(springWaveConfig, 'flowRenderMode', [DUAL_TRACK_FLOW_MODE_FLIP, DUAL_TRACK_FLOW_MODE_COLOR_ONLY]).name('呈现方式').onChange((value) => {
        if (experienceState.autoOrchestration && value === DUAL_TRACK_FLOW_MODE_COLOR_ONLY) {
            springWaveConfig.flowRenderMode = DUAL_TRACK_FLOW_MODE_FLIP;
            updateGuiFolderDisplay(guiPanel);
            updateExperienceStatus('自动编排已禁用“颜色流动(不翻转)”，已切回翻转流动');
        }
    });
    dualTrackFolder.add(springWaveConfig, 'flowDirection', ['正向', '反向']).name('流动方向');
    dualTrackFolder.add(springWaveConfig, 'flowStepMs', 20, 420).step(5).name('流动步进(ms)');
    dualTrackFolder.add(springWaveConfig, 'flowCycles', 1, 12).step(1).name('流动循环');
    dualTrackFolder.add(springWaveConfig, 'flowBandSize', 1, 4).step(1).name('流动带宽');
    const equalizerFolder = springWaveFolder.addFolder('效果5 柱形均衡波');
    equalizerFolder.add(springWaveConfig, 'equalizerDrive', ['随机波动', '音频频段', '指标驱动']).name('柱形驱动');
    equalizerFolder.add(springWaveConfig, 'equalizerBars', 8, 64).step(1).name('柱子数量');
    equalizerFolder.add(springWaveConfig, 'equalizerAreaRatio', 0.2, 1).step(0.01).name('柱形高度范围');
    equalizerFolder.add(springWaveConfig, 'equalizerUpdateMs', 40, 500).step(5).name('刷新间隔(ms)');
    equalizerFolder.add(springWaveConfig, 'equalizerSmoothing', 0.05, 0.92).step(0.01).name('基础平滑');
    equalizerFolder.add(springWaveConfig, 'equalizerAttack', 0.15, 0.98).step(0.01).name('上升响应');
    equalizerFolder.add(springWaveConfig, 'equalizerDecay', 0.01, 0.4).step(0.005).name('回落速度');
    equalizerFolder.add(springWaveConfig, 'equalizerMinRatio', 0, 0.45).step(0.01).name('最小高度比');
    equalizerFolder.add(springWaveConfig, 'equalizerMaxRatio', 0.2, 1).step(0.01).name('最大高度比');
    equalizerFolder.add(springWaveConfig, 'equalizerRandomness', 0, 0.95).step(0.01).name('随机扰动');
    equalizerFolder.add(springWaveConfig, 'equalizerAudioGain', 0.5, 3.0).step(0.05).name('音频增益');
    equalizerFolder.add(springWaveConfig, 'equalizerFluxGain', 0, 6).step(0.1).name('形状敏感度');
    equalizerFolder.add(springWaveConfig, 'equalizerSpectrumBalance', 0, 2).step(0.01).name('高频补偿');
    equalizerFolder.add(springWaveConfig, 'equalizerBodyMotion', 0, 1).step(0.01).name('柱体整体翻动');
    equalizerFolder.add(springWaveConfig, 'equalizerTempoSync', ['关闭', '跟随音频能量', '节拍优先']).name('节拍同步速度');
    equalizerFolder.add(springWaveConfig, 'equalizerSyncStrength', 0, 1).step(0.01).name('同步强度');
    equalizerFolder.add(springWaveConfig, 'equalizerSyncMinMs', 24, 240).step(1).name('同步最快(ms)');
    equalizerFolder.add(springWaveConfig, 'equalizerSyncMaxMs', 40, 520).step(1).name('同步最慢(ms)');
    equalizerFolder.add(springWaveConfig, 'equalizerBeatPulse', 0, 1).step(0.01).name('拍点冲击');
    equalizerFolder.add(springWaveConfig, 'equalizerResetOnStart').name('启动时清空柱形');
    const mosaicFolder = springWaveFolder.addFolder('效果6 矩形闪烁块');
    mosaicFolder.add(springWaveConfig, 'mosaicFaceA', { 面1: 1, 面2: 2 }).name('撞色面A');
    mosaicFolder.add(springWaveConfig, 'mosaicFaceB', { 面1: 1, 面2: 2 }).name('撞色面B');
    mosaicFolder.add(springWaveConfig, 'mosaicMinLen', 1, 18).step(1).name('最短长度');
    mosaicFolder.add(springWaveConfig, 'mosaicMaxLen', 2, 30).step(1).name('最长长度');
    mosaicFolder.add(springWaveConfig, 'mosaicHorizontalBias', 0, 1).step(0.01).name('横向偏好');
    mosaicFolder.add(springWaveConfig, 'mosaicActivationRate', 0.02, 0.95).step(0.01).name('点亮概率');
    mosaicFolder.add(springWaveConfig, 'mosaicDecayRate', 0.01, 0.95).step(0.01).name('熄灭概率');
    mosaicFolder.add(springWaveConfig, 'mosaicSwapRate', 0, 0.95).step(0.01).name('换色概率');
    mosaicFolder.add(springWaveConfig, 'mosaicContrastBias', 0, 1).step(0.01).name('撞色A占比');
    mosaicFolder.add(springWaveConfig, 'mosaicUpdateMs', 40, 600).step(5).name('刷新间隔(ms)');
    mosaicFolder.add(springWaveConfig, 'mosaicRebuildMs', 600, 12000).step(50).name('重分块间隔(ms)');
    mosaicFolder.add(springWaveConfig, 'mosaicResetOnStart').name('启动先熄灭');
    mosaicFolder.add(springWaveConfig, 'mosaicTempoSync', ['关闭', '跟随音频能量', '节拍优先']).name('音频同步速度');
    mosaicFolder.add(springWaveConfig, 'mosaicSyncStrength', 0, 1).step(0.01).name('同步强度');
    mosaicFolder.add(springWaveConfig, 'mosaicSyncMinMs', 30, 360).step(1).name('同步最快(ms)');
    mosaicFolder.add(springWaveConfig, 'mosaicSyncMaxMs', 60, 700).step(1).name('同步最慢(ms)');

    const sweepFolder = springWaveFolder.addFolder('效果3 扫光配置');
    sweepFolder.addColor(sweepLightConfig, 'color').name('光色').onChange(updateSweepLightParams);
    sweepFolder.add(sweepLightConfig, 'intensity', 0.5, 12).step(0.1).name('光强');
    sweepFolder.add(sweepLightConfig, 'count', 1, 12).step(1).name('并列灯数').onChange(() => {
        rebuildSweepLights();
        updateSweepLightParams();
    });
    sweepFolder.add(sweepLightConfig, 'spanScale', 0.6, 2.2).step(0.01).name('横向覆盖');
    sweepFolder.add(sweepLightConfig, 'edgeAttenuation', 0, 0.8).step(0.01).name('边缘衰减');
    sweepFolder.add(sweepLightConfig, 'angle', 0.3, Math.PI / 2).step(0.01).name('覆盖角度').onChange(updateSweepLightParams);
    sweepFolder.add(sweepLightConfig, 'penumbra', 0.2, 1).step(0.01).name('边缘柔和').onChange(updateSweepLightParams);
    sweepFolder.add(sweepLightConfig, 'distance', 30, 260).step(1).name('照射距离').onChange(updateSweepLightParams);
    sweepFolder.add(sweepLightConfig, 'z', 8, 60).step(0.5).name('灯距(Z)');
    sweepFolder.add(sweepLightConfig, 'durationMs', 500, 8000).step(50).name('扫光时长(ms)');
    sweepFolder.add(sweepLightConfig, 'overscan', 0, 0.8).step(0.01).name('超出边界比例');
    sweepFolder.add(sweepLightConfig, 'xOffset', -20, 20).step(0.1).name('横向偏移');
    springWaveFolder.add({ startNow: () => startSpringWave() }, 'startNow').name('开始播放');
    springWaveFolder.add({ stopNow: () => stopSpringWave({ resetPose: true }) }, 'stopNow').name('停止播放');
    guiRefs.springWaveFolder = springWaveFolder;

    const musicFolder = gui.addFolder('春晚音乐驱动');
    musicFolder.add(musicDriveConfig, 'sourceUrl').name('音视频链接');
    musicFolder.add({ loadLink: () => { loadMusicFromUrl(); } }, 'loadLink').name('加载链接');
    musicFolder.add({ pickLocal: () => pickLocalMusicFile() }, 'pickLocal').name('上传本地文件');
    musicFolder.add(musicDriveConfig, 'autoPlayAfterLoad').name('加载后自动启动');
    musicFolder.add(musicDriveConfig, 'sourceLoop').name('音源循环');
    musicFolder.add(musicDriveConfig, 'autoTrigger').name('节拍触发特效');
    musicFolder.add(musicDriveConfig, 'smoothing', 0.2, 0.95).step(0.01).name('能量平滑');
    musicFolder.add(musicDriveConfig, 'gainBoost', 0.5, 3.0).step(0.05).name('能量增益');
    musicFolder.add(musicDriveConfig, 'beatThreshold', 0.08, 0.95).step(0.01).name('节拍阈值');
    musicFolder.add(musicDriveConfig, 'beatFluxThreshold', 0.005, 0.2).step(0.001).name('突增阈值');
    musicFolder.add(musicDriveConfig, 'beatCooldownMs', 80, 800).step(10).name('节拍冷却(ms)');
    musicFolder.add(musicDriveConfig, 'triggerIntervalMs', 80, 1200).step(10).name('触发间隔(ms)');
    musicFolder.add({ startNow: () => { startMusicDrive(); } }, 'startNow').name('开始音乐驱动');
    musicFolder.add({ stopNow: () => stopMusicDrive({ keepSource: true, pauseAudio: true }) }, 'stopNow').name('停止音乐驱动');
    musicFolder.add({ clearSource: () => stopMusicDrive({ keepSource: false, pauseAudio: true }) }, 'clearSource').name('清空音源');
    musicFolder.add(musicDriveUi, 'status').name('解析状态').listen();
    guiRefs.musicFolder = musicFolder;

    const lyricFolder = gui.addFolder('歌词调试');
    lyricFolder.add(lyricDebugConfig, 'lineDebugMode').name('逐句调试模式').listen().onChange((value) => {
        setLyricLineDebugMode(value);
    });
    lyricFolder.add(lyricDebugConfig, 'lineSeekStepSec', 0.02, 1.0).step(0.01).name('左右步长(s)');
    lyricFolder.add({ prevLine: () => jumpLyricDebugLine(-1) }, 'prevLine').name('目标句 -1');
    lyricFolder.add({ nextLine: () => jumpLyricDebugLine(1) }, 'nextLine').name('目标句 +1');
    lyricFolder.add({ moveLeft: () => nudgeLyricDebugPlayhead(-lyricDebugConfig.lineSeekStepSec) }, 'moveLeft').name('时间左移');
    lyricFolder.add({ moveRight: () => nudgeLyricDebugPlayhead(lyricDebugConfig.lineSeekStepSec) }, 'moveRight').name('时间右移');
    lyricFolder.add({ confirmLine: () => confirmCurrentLyricDebugLine() }, 'confirmLine').name('确认当前句');
    lyricFolder.add({ exitLineDebug: () => setLyricLineDebugMode(false) }, 'exitLineDebug').name('结束逐句调试');
    lyricFolder.add(lyricDebugConfig, 'offsetSec', -20, 20).step(0.01).name('整体偏移(s)').onChange(() => {
        applyLyricTimingAdjustments({ keepCurrent: true });
    });
    lyricFolder.add(lyricDebugConfig, 'timeScale', 0.85, 1.2).step(0.0005).name('时间缩放').onChange(() => {
        applyLyricTimingAdjustments({ keepCurrent: true });
    });
    lyricFolder.add(lyricDebugConfig, 'nudgeStep', 0.01, 0.5).step(0.01).name('微调步长(s)');
    lyricFolder.add({ back: () => nudgeLyricOffset(-lyricDebugConfig.nudgeStep) }, 'back').name('偏移 -步长');
    lyricFolder.add({ forward: () => nudgeLyricOffset(lyricDebugConfig.nudgeStep) }, 'forward').name('偏移 +步长');
    lyricFolder.add({ alignCurrent: () => alignCurrentLyricToPlayback() }, 'alignCurrent').name('当前句对齐当前时刻');
    lyricFolder.add({ resetAll: () => resetLyricTimingAdjustments() }, 'resetAll').name('重置时间轴');
    lyricFolder.add({ exportNow: () => exportCurrentAdjustedLyrics() }, 'exportNow').name('导出当前歌词');
    lyricFolder.add(lyricDebugConfig, 'status').name('状态').listen();
    guiRefs.lyricFolder = lyricFolder;

    const folder = gui.addFolder('初始角度调整');

    const updateRotations = () => {
        pixels.forEach(p => {
            const face = Number.isFinite(p.userData.faceIndex) ? p.userData.faceIndex : 0;
            p.userData.baseRotationX = config.initRotationX;
            const targetX = config.initRotationX + face * ((Math.PI * 2) / 3);
            p.rotation.set(targetX, config.initRotationY, config.initRotationZ);
            p.userData.targetRotationX = targetX;
            p.userData.targetFaceIndex = face;
            p.userData.currentOn = face !== 0;
            p.userData.targetOn = face !== 0;
            p.userData.isAnimating = false;
        });
    };

    const rebuildGrid = () => {
        config.gridRows = Math.max(1, Math.floor(config.gridRows));
        config.gridCols = Math.max(1, Math.floor(config.gridCols));
        createPixelWall();
    };

    folder.add(config, 'initRotationX', -Math.PI, Math.PI).step(0.01).name('X 轴角度').onChange(updateRotations);
    folder.add(config, 'initRotationY', -Math.PI, Math.PI).step(0.01).name('Y 轴角度').onChange(updateRotations);
    folder.add(config, 'gridRows', 1, 120).step(1).name('纵向像素').onFinishChange(rebuildGrid);
    folder.add(config, 'gridCols', 1, 240).step(1).name('横向像素').onFinishChange(rebuildGrid);
    folder.add(config, 'gap', 0.0, 0.5).step(0.001).name('行列间距').onChange(updatePositions);
    folder.open();

    // 相机设置面板
    const camFolder = gui.addFolder('相机视角设置');
    const updateCamera = () => {
        camera.position.set(config.camX, config.camY, config.camZ);
        controls.target.set(0, 0, 0);

        camera.fov = config.camFov;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        controls.update();
    };
    camFolder.add(config, 'camX', -50, 50).name('位置 X').onChange(updateCamera);
    camFolder.add(config, 'camY', -50, 50).name('位置 Y').onChange(updateCamera);
    camFolder.add(config, 'camZ', 0, 320).name('位置 Z').onChange(updateCamera);
    camFolder.add(config, 'camFov', 18, 65).name('透视强度(FOV)').onChange(updateCamera);
    camFolder.open();

    // 灯光设置面板
    const lightFolder = gui.addFolder('光源设置');
    const updateLights = () => {
        spotLight.position.set(config.spotLightX, config.spotLightY, config.spotLightZ);
        spotLight.intensity = config.spotLightIntensity;
        spotLight.angle = config.spotLightAngle;
        spotLight.penumbra = config.spotLightPenumbra;

        fillLight.position.set(config.fillLightX, config.fillLightY, config.fillLightZ);
        fillLight.intensity = config.fillLightIntensity;
        updateSweepLightParams();
    };

    // 主光源 (SpotLight)
    lightFolder.add(config, 'spotLightX', -50, 50).name('主光 X').onChange(updateLights);
    lightFolder.add(config, 'spotLightY', -50, 50).name('主光 Y').onChange(updateLights);
    lightFolder.add(config, 'spotLightZ', 0, 100).name('主光 Z').onChange(updateLights);
    lightFolder.add(config, 'spotLightIntensity', 0, 4).name('主光强度').onChange(updateLights);
    lightFolder.add(config, 'spotLightAngle', 0, Math.PI / 2).name('光照角度').onChange(updateLights);
    lightFolder.add(config, 'spotLightPenumbra', 0, 1).name('边缘柔化').onChange(updateLights);

    // 补光 (Directional)
    lightFolder.add(config, 'fillLightX', -20, 20).name('补光 X').onChange(updateLights);
    lightFolder.add(config, 'fillLightY', -20, 20).name('补光 Y').onChange(updateLights);
    lightFolder.add(config, 'fillLightZ', -20, 20).name('补光 Z').onChange(updateLights);
    lightFolder.add(config, 'fillLightIntensity', 0, 2).name('补光强度').onChange(updateLights);

    const faceFolder = gui.addFolder('三面颜色');
    faceFolder.add(faceColorParams, 'globalSeparation', 0.8, 1.8).step(0.01).name('差异增强').onChange(updateFaceMaterials);

    const addFaceColorControls = (parentFolder, index, label) => {
        const section = parentFolder.addFolder(label);
        section.addColor(faceColorParams, 'color' + index).name('基色').onChange(updateFaceMaterials);
        section.add(faceColorParams, 'hueShift' + index, -0.2, 0.2).step(0.001).name('色相偏移').onChange(updateFaceMaterials);
        section.add(faceColorParams, 'saturation' + index, 0, 2).step(0.01).name('饱和度').onChange(updateFaceMaterials);
        section.add(faceColorParams, 'lightness' + index, 0.5, 1.5).step(0.01).name('明度').onChange(updateFaceMaterials);
    };

    addFaceColorControls(faceFolder, 1, '面 1');
    addFaceColorControls(faceFolder, 2, '面 2');
    addFaceColorControls(faceFolder, 3, '面 3');

    const metalFolder = gui.addFolder('金属材质');
    metalFolder.add(materialParams, 'roughness', 0.01, 0.2).name('粗糙度').onChange(updateMetalMaterials);
    metalFolder.add(materialParams, 'metalness', 0.7, 1).name('金属度').onChange(updateMetalMaterials);
    metalFolder.add(materialParams, 'clearcoat', 0.2, 1).name('清漆层').onChange(updateMetalMaterials);
    metalFolder.add(materialParams, 'clearcoatRoughness', 0.005, 0.12).name('清漆粗糙').onChange(updateMetalMaterials);
    metalFolder.add(materialParams, 'envMapIntensity', 1.2, 6).name('反射强度').onChange(updateMetalMaterials);

    const envFolder = gui.addFolder('反射环境');
    const bgFolder = envFolder.addFolder('背景渐变');
    bgFolder.addColor(envParams, 'bgTop').name('顶部色').onChange(scheduleEnvironmentRebuild);
    bgFolder.addColor(envParams, 'bgMid').name('中段色').onChange(scheduleEnvironmentRebuild);
    bgFolder.addColor(envParams, 'bgBottom').name('底部色').onChange(scheduleEnvironmentRebuild);

    const strip1Folder = envFolder.addFolder('高光条 1');
    strip1Folder.add(envParams, 'strip1X', 0, 1024).step(1).name('X').onChange(scheduleEnvironmentRebuild);
    strip1Folder.add(envParams, 'strip1Width', 10, 320).step(1).name('宽度').onChange(scheduleEnvironmentRebuild);
    strip1Folder.add(envParams, 'strip1Alpha', 0, 1).step(0.01).name('透明度').onChange(scheduleEnvironmentRebuild);
    strip1Folder.addColor(envParams, 'strip1Top').name('顶部色').onChange(scheduleEnvironmentRebuild);
    strip1Folder.addColor(envParams, 'strip1Bottom').name('底部色').onChange(scheduleEnvironmentRebuild);

    const strip2Folder = envFolder.addFolder('高光条 2');
    strip2Folder.add(envParams, 'strip2X', 0, 1024).step(1).name('X').onChange(scheduleEnvironmentRebuild);
    strip2Folder.add(envParams, 'strip2Width', 10, 320).step(1).name('宽度').onChange(scheduleEnvironmentRebuild);
    strip2Folder.add(envParams, 'strip2Alpha', 0, 1).step(0.01).name('透明度').onChange(scheduleEnvironmentRebuild);
    strip2Folder.addColor(envParams, 'strip2Top').name('顶部色').onChange(scheduleEnvironmentRebuild);
    strip2Folder.addColor(envParams, 'strip2Bottom').name('底部色').onChange(scheduleEnvironmentRebuild);

    const strip3Folder = envFolder.addFolder('高光条 3');
    strip3Folder.add(envParams, 'strip3X', 0, 1024).step(1).name('X').onChange(scheduleEnvironmentRebuild);
    strip3Folder.add(envParams, 'strip3Width', 10, 320).step(1).name('宽度').onChange(scheduleEnvironmentRebuild);
    strip3Folder.add(envParams, 'strip3Alpha', 0, 1).step(0.01).name('透明度').onChange(scheduleEnvironmentRebuild);
    strip3Folder.addColor(envParams, 'strip3Top').name('顶部色').onChange(scheduleEnvironmentRebuild);
    strip3Folder.addColor(envParams, 'strip3Bottom').name('底部色').onChange(scheduleEnvironmentRebuild);

    const block1Folder = envFolder.addFolder('色块 1 (靛蓝)');
    block1Folder.add(envParams, 'block1Enabled').name('启用').onChange(scheduleEnvironmentRebuild);
    block1Folder.add(envParams, 'block1X', 0, 1024).step(1).name('X').onChange(scheduleEnvironmentRebuild);
    block1Folder.add(envParams, 'block1Y', 0, 512).step(1).name('Y').onChange(scheduleEnvironmentRebuild);
    block1Folder.add(envParams, 'block1Width', 10, 600).step(1).name('宽度').onChange(scheduleEnvironmentRebuild);
    block1Folder.add(envParams, 'block1Height', 10, 250).step(1).name('高度').onChange(scheduleEnvironmentRebuild);
    block1Folder.add(envParams, 'block1Alpha', 0, 1).step(0.01).name('透明度').onChange(scheduleEnvironmentRebuild);
    block1Folder.addColor(envParams, 'block1Start').name('渐变起色').onChange(scheduleEnvironmentRebuild);
    block1Folder.addColor(envParams, 'block1End').name('渐变终色').onChange(scheduleEnvironmentRebuild);

    const block2Folder = envFolder.addFolder('色块 2');
    block2Folder.add(envParams, 'block2Enabled').name('启用').onChange(scheduleEnvironmentRebuild);
    block2Folder.add(envParams, 'block2X', 0, 1024).step(1).name('X').onChange(scheduleEnvironmentRebuild);
    block2Folder.add(envParams, 'block2Y', 0, 512).step(1).name('Y').onChange(scheduleEnvironmentRebuild);
    block2Folder.add(envParams, 'block2Width', 10, 600).step(1).name('宽度').onChange(scheduleEnvironmentRebuild);
    block2Folder.add(envParams, 'block2Height', 10, 250).step(1).name('高度').onChange(scheduleEnvironmentRebuild);
    block2Folder.add(envParams, 'block2Alpha', 0, 1).step(0.01).name('透明度').onChange(scheduleEnvironmentRebuild);
    block2Folder.addColor(envParams, 'block2Start').name('渐变起色').onChange(scheduleEnvironmentRebuild);
    block2Folder.addColor(envParams, 'block2End').name('渐变终色').onChange(scheduleEnvironmentRebuild);

    const sparkleFolder = envFolder.addFolder('亮点');
    sparkleFolder.add(envParams, 'sparkleCount', 0, 50).step(1).name('数量').onChange(scheduleEnvironmentRebuild);
    sparkleFolder.add(envParams, 'sparkleSize', 1, 12).step(0.1).name('尺寸').onChange(scheduleEnvironmentRebuild);
    sparkleFolder.add(envParams, 'sparkleAlpha', 0, 1).step(0.01).name('透明度').onChange(scheduleEnvironmentRebuild);
}

function updateMetalMaterials() {
    materials.forEach((material) => {
        material.roughness = materialParams.roughness;
        material.metalness = materialParams.metalness;
        material.clearcoat = materialParams.clearcoat;
        material.clearcoatRoughness = materialParams.clearcoatRoughness;
        material.envMapIntensity = materialParams.envMapIntensity;
        material.needsUpdate = true;
    });

    if (!innerMaterial) {
        return;
    }

    innerMaterial.roughness = Math.min(materialParams.roughness + 0.08, 0.3);
    innerMaterial.metalness = Math.max(materialParams.metalness - 0.25, 0.35);
    innerMaterial.clearcoat = Math.max(materialParams.clearcoat - 0.35, 0.0);
    innerMaterial.clearcoatRoughness = Math.min(materialParams.clearcoatRoughness + 0.03, 0.2);
    innerMaterial.envMapIntensity = Math.max(materialParams.envMapIntensity - 0.8, 0.8);
    innerMaterial.needsUpdate = true;
}

function resolveTrackColor(value, fallbackHex) {
    const color = new THREE.Color(fallbackHex);
    try {
        color.set(value || fallbackHex);
    } catch (error) {
        color.set(fallbackHex);
    }
    return color;
}

function getPlateFaceMaterialIndex(material) {
    if (!material) {
        return -1;
    }
    for (let i = 0; i < materials.length; i++) {
        if (material === materials[i]) {
            return i;
        }
    }
    if (material.userData && Number.isFinite(material.userData.baseFaceMaterialIndex)) {
        return clamp(Math.floor(material.userData.baseFaceMaterialIndex), 0, 2);
    }
    return -1;
}

function clearGroupTrackColorOverride(group) {
    if (!group || !group.userData) {
        return;
    }
    const entries = group.userData.trackColorOverride;
    if (!Array.isArray(entries) || entries.length === 0) {
        return;
    }
    for (const entry of entries) {
        if (!entry || !entry.mesh) {
            continue;
        }
        const faceIndex = clamp(Math.floor(entry.faceIndex || 0), 0, 2);
        if (materials[faceIndex]) {
            entry.mesh.material = materials[faceIndex];
        }
        if (entry.material && typeof entry.material.dispose === 'function') {
            entry.material.dispose();
        }
    }
    group.userData.trackColorOverride = null;
}

function clearAllTrackColorOverrides() {
    for (const group of pixels) {
        if (!group || !group.userData || group.userData.isRim) {
            continue;
        }
        clearGroupTrackColorOverride(group);
    }
}

function ensureGroupTrackColorOverride(group) {
    if (!group || !group.userData || group.userData.isRim) {
        return null;
    }
    const existing = group.userData.trackColorOverride;
    if (Array.isArray(existing) && existing.length > 0) {
        return existing;
    }

    const entries = [];
    group.traverse((child) => {
        if (!child.isMesh || !child.material) {
            return;
        }
        const faceIndex = getPlateFaceMaterialIndex(child.material);
        if (faceIndex < 0 || faceIndex > 2) {
            return;
        }
        const localMaterial = child.material.clone();
        localMaterial.userData = {
            ...(localMaterial.userData || {}),
            baseFaceMaterialIndex: faceIndex
        };
        child.material = localMaterial;
        entries.push({
            mesh: child,
            material: localMaterial,
            faceIndex
        });
    });

    group.userData.trackColorOverride = entries;
    return entries;
}

function applyGroupTrackColor(group, colorValue) {
    const entries = ensureGroupTrackColorOverride(group);
    if (!Array.isArray(entries) || entries.length === 0) {
        return false;
    }
    const color = (colorValue && colorValue.isColor) ? colorValue : resolveTrackColor(colorValue, '#ffffff');
    for (const entry of entries) {
        if (!entry.material || !entry.material.color) {
            continue;
        }
        entry.material.color.copy(color);
        entry.material.needsUpdate = true;
    }
    return true;
}

function freezePixelsForInstantColorFlow() {
    const step = (Math.PI * 2) / 3;
    for (const group of pixels) {
        if (!group || !group.userData || group.userData.isRim) {
            continue;
        }
        const baseRotationX = Number.isFinite(group.userData.baseRotationX)
            ? group.userData.baseRotationX
            : config.initRotationX;
        const face = normalizeFaceIndex(Math.round((group.rotation.x - baseRotationX) / step));
        const targetRotation = baseRotationX + face * step;
        group.rotation.x = targetRotation;
        group.userData.faceIndex = face;
        group.userData.targetFaceIndex = face;
        group.userData.targetRotationX = targetRotation;
        group.userData.currentOn = face !== 0;
        group.userData.targetOn = face !== 0;
        group.userData.isAnimating = false;
        group.userData.motionDamping = null;
    }
}

function clearPixelWall() {
    clearAllTrackColorOverrides();
    pixels.forEach((pixel) => {
        scene.remove(pixel);
    });
    edgeRimMeshes.forEach((mesh) => {
        scene.remove(mesh);
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }
        if (mesh.material && typeof mesh.material.dispose === 'function') {
            mesh.material.dispose();
        }
    });
    edgeRimMeshes.length = 0;
    pixels.length = 0;
    pixelLookup.clear();
    activeMask = [];
    activeWallBounds = null;
}

function isMaskCellOn(mask, row, col) {
    if (row < 0 || col < 0 || row >= mask.length || col >= mask[0].length) {
        return false;
    }
    return mask[row][col] === 1;
}

function isBoundaryCell(mask, row, col) {
    if (!isMaskCellOn(mask, row, col)) {
        return false;
    }
    return (
        !isMaskCellOn(mask, row - 1, col) ||
        !isMaskCellOn(mask, row + 1, col) ||
        !isMaskCellOn(mask, row, col - 1) ||
        !isMaskCellOn(mask, row, col + 1)
    );
}

function createEdgeRimForSpringMask(mask, rows, cols, gap, prototypePrism) {
    if (!isSpringFestivalMode()) {
        return;
    }

    const pitch = UNIT_SIZE + gap;
    const half = UNIT_SIZE / 2;
    const totalWidth = cols * pitch;
    const totalHeight = rows * pitch;
    const rimDepthLayers = 2; // 按需求固定为 2 像素深度
    const rimOutOffset = half;

    const spawnRimPixel = (x, y, z, rx, ry, rz) => {
        const rimPixel = prototypePrism.clone();
        rimPixel.position.set(x, y, z);
        rimPixel.rotation.set(rx, ry, rz);
        rimPixel.userData = {
            isRim: true,
            isAnimating: false
        };

        // 包边不参与鼠标命中与翻转
        rimPixel.traverse((child) => {
            if (child.isMesh) {
                child.raycast = () => null;
                child.userData.parentGroup = null;
            }
        });

        scene.add(rimPixel);
        edgeRimMeshes.push(rimPixel);
    };

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!isBoundaryCell(mask, row, col)) {
                continue;
            }

            const worldRow = rows - 1 - row;
            const cellX = (col * pitch) - (totalWidth / 2) + half;
            const cellY = (worldRow * pitch) - (totalHeight / 2) + half;
            const hasTop = isMaskCellOn(mask, row - 1, col);
            const hasBottom = isMaskCellOn(mask, row + 1, col);
            const hasLeft = isMaskCellOn(mask, row, col - 1);
            const hasRight = isMaskCellOn(mask, row, col + 1);
            const sideBaseX = config.initRotationX - Math.PI / 2;

            for (let layer = 1; layer <= rimDepthLayers; layer++) {
                const z = -layer * pitch;

                // 左右边：以上边已验证姿态为基准，绕 Z 轴 ±90°
                if (!hasLeft) {
                    spawnRimPixel(
                        cellX - rimOutOffset,
                        cellY,
                        z,
                        sideBaseX,
                        config.initRotationY,
                        config.initRotationZ + Math.PI / 2
                    );
                }
                if (!hasRight) {
                    spawnRimPixel(
                        cellX + rimOutOffset,
                        cellY,
                        z,
                        sideBaseX,
                        config.initRotationY,
                        config.initRotationZ - Math.PI / 2
                    );
                }

                // 上下边：让主可见面朝向上下侧面（绕 X 轴旋转）
                if (!hasTop) {
                    spawnRimPixel(
                        cellX,
                        cellY + rimOutOffset,
                        z,
                        config.initRotationX - Math.PI / 2,
                        config.initRotationY,
                        config.initRotationZ
                    );
                }
                if (!hasBottom) {
                    spawnRimPixel(
                        cellX,
                        cellY - rimOutOffset,
                        z,
                        config.initRotationX + Math.PI / 2,
                        config.initRotationY,
                        config.initRotationZ
                    );
                }
            }
        }
    }
}

function createFilledMask(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill(1));
}

function createEmptyMask(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function setMaskRect(mask, top, left, height, width, value = true) {
    const rows = mask.length;
    const cols = rows > 0 ? mask[0].length : 0;
    const rowStart = Math.max(0, top);
    const rowEnd = Math.min(rows, top + height);
    const colStart = Math.max(0, left);
    const colEnd = Math.min(cols, left + width);

    for (let row = rowStart; row < rowEnd; row++) {
        for (let col = colStart; col < colEnd; col++) {
            mask[row][col] = value ? 1 : 0;
        }
    }
}

function getSpringModuleBounds() {
    return {
        cols: SPRING_GALA_LAYOUT_COLS,
        rows: SPRING_GALA_LAYOUT_ROWS
    };
}

function countMaskCells(mask) {
    let count = 0;
    for (let row = 0; row < mask.length; row++) {
        for (let col = 0; col < mask[row].length; col++) {
            if (mask[row][col] === 1) {
                count += 1;
            }
        }
    }
    return count;
}

function masksEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
        return false;
    }
    for (let row = 0; row < a.length; row++) {
        const rowA = a[row];
        const rowB = b[row];
        if (!Array.isArray(rowA) || !Array.isArray(rowB) || rowA.length !== rowB.length) {
            return false;
        }
        for (let col = 0; col < rowA.length; col++) {
            if (rowA[col] !== rowB[col]) {
                return false;
            }
        }
    }
    return true;
}

function buildSpringFestivalMask(rows, cols) {
    const mask = createEmptyMask(rows, cols);
    const moduleSize = Math.max(1, Math.min(sceneModeConfig.strokePixels, Math.floor(Math.min(rows, cols) / 4)));
    const patternCols = SPRING_GALA_LAYOUT_COLS * moduleSize;
    const patternRows = SPRING_GALA_LAYOUT_ROWS * moduleSize;
    const startCol = Math.floor((cols - patternCols) / 2);
    const startRow = Math.floor((rows - patternRows) / 2);

    SPRING_GALA_ROW_SEGMENTS.forEach(([moduleRow, segments]) => {
        const top = startRow + moduleRow * moduleSize;
        segments.forEach(([startModuleCol, endModuleCol]) => {
            const left = startCol + startModuleCol * moduleSize;
            const width = (endModuleCol - startModuleCol + 1) * moduleSize;
            setMaskRect(mask, top, left, moduleSize, width, true);
        });
    });

    const active = countMaskCells(mask);
    if (active < Math.max(12, Math.floor(rows * cols * 0.08))) {
        return createFilledMask(rows, cols);
    }
    return mask;
}

function buildActiveMask(rows, cols) {
    if (!isSpringFestivalMode()) {
        return createFilledMask(rows, cols);
    }
    return buildSpringFestivalMask(rows, cols);
}

function computeActiveWallBounds(mask, rows, cols, gap) {
    const pitch = UNIT_SIZE + gap;
    const half = UNIT_SIZE / 2;
    const totalWidth = cols * pitch;
    const totalHeight = rows * pitch;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!mask[row] || mask[row][col] !== 1) {
                continue;
            }
            const worldRow = rows - 1 - row;
            const x = (col * pitch) - (totalWidth / 2) + half;
            const y = (worldRow * pitch) - (totalHeight / 2) + half;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }

    if (!Number.isFinite(minX)) {
        return {
            minX: -1,
            maxX: 1,
            minY: -1,
            maxY: 1,
            centerX: 0,
            centerY: 0,
            width: 2,
            height: 2
        };
    }

    return {
        minX,
        maxX,
        minY,
        maxY,
        centerX: (minX + maxX) * 0.5,
        centerY: (minY + maxY) * 0.5,
        width: Math.max(UNIT_SIZE, maxX - minX + UNIT_SIZE),
        height: Math.max(UNIT_SIZE, maxY - minY + UNIT_SIZE)
    };
}

function createPixelWall() {
    clearPixelWall();

    const rows = Math.max(1, Math.floor(config.gridRows));
    const cols = Math.max(1, Math.floor(config.gridCols));
    const gap = config.gap;
    const prototypePrism = createPrismPrototype();
    activeMask = buildActiveMask(rows, cols);
    activeWallBounds = computeActiveWallBounds(activeMask, rows, cols, gap);

    const totalWidth = cols * (UNIT_SIZE + gap);
    const totalHeight = rows * (UNIT_SIZE + gap);

    for (let logicalRow = 0; logicalRow < rows; logicalRow++) {
        for (let col = 0; col < cols; col++) {
            if (!activeMask[logicalRow][col]) {
                continue;
            }
            const prism = prototypePrism.clone();
            const worldRow = rows - 1 - logicalRow;

            prism.position.x = (col * (UNIT_SIZE + gap)) - (totalWidth / 2) + (UNIT_SIZE / 2);
            prism.position.y = (worldRow * (UNIT_SIZE + gap)) - (totalHeight / 2) + (UNIT_SIZE / 2);
            prism.rotation.set(config.initRotationX, config.initRotationY, config.initRotationZ);
            prism.userData = {
                baseRotationX: config.initRotationX,
                faceIndex: 0,
                targetFaceIndex: 0,
                currentOn: false,
                targetOn: false,
                targetRotationX: config.initRotationX,
                isAnimating: false,
                gridRow: logicalRow,
                gridCol: col
            };

            prism.traverse((child) => {
                if (child.isMesh) {
                    child.userData.parentGroup = prism;
                }
            });

            scene.add(prism);
            pixels.push(prism);
            pixelLookup.set(gridKey(logicalRow, col), prism);
        }
    }

    createEdgeRimForSpringMask(activeMask, rows, cols, gap, prototypePrism);

    if (playbackState.lastText && isDisplayMode()) {
        const grid = renderTextToGrid(playbackState.lastText);
        applyTextGrid(grid, true);
    }
    if (isSpringFestivalMode() && !experienceState.active) {
        applyWallOverviewCamera({ fov: Math.min(config.camFov, 32) });
    }
}

function updatePositions() {
    const rows = Math.max(1, Math.floor(config.gridRows));
    const cols = Math.max(1, Math.floor(config.gridCols));
    const gap = config.gap;
    if (isSpringFestivalMode()) {
        createPixelWall();
        return;
    }
    const expectedMask = buildActiveMask(rows, cols);
    const expectedCount = countMaskCells(expectedMask);
    const knownCols = activeMask.length > 0 ? activeMask[0].length : 0;
    const maskSizeChanged = activeMask.length !== rows || knownCols !== cols;
    const maskShapeChanged = !masksEqual(activeMask, expectedMask);
    if (maskSizeChanged || maskShapeChanged || pixels.length !== expectedCount) {
        createPixelWall();
        return;
    }

    const totalWidth = cols * (UNIT_SIZE + gap);
    const totalHeight = rows * (UNIT_SIZE + gap);

    pixels.forEach((prism) => {
        const logicalRow = Number.isFinite(prism.userData.gridRow) ? prism.userData.gridRow : 0;
        const col = Number.isFinite(prism.userData.gridCol) ? prism.userData.gridCol : 0;
        const worldRow = rows - 1 - logicalRow;
        prism.position.x = (col * (UNIT_SIZE + gap)) - (totalWidth / 2) + (UNIT_SIZE / 2);
        prism.position.y = (worldRow * (UNIT_SIZE + gap)) - (totalHeight / 2) + (UNIT_SIZE / 2);
    });
}

function parseDisplaySequence(raw) {
    return String(raw || '')
        .split(/[\n|,;]+/)
        .map(item => item.trim())
        .filter(Boolean);
}

function normalizeDisplayText(text) {
    return String(text || '').trim();
}

function containsOnlyPixelFontChars(text) {
    const upper = normalizeDisplayText(text).toUpperCase();
    if (!upper) return true;
    for (const ch of upper) {
        if (!PIXEL_FONT[ch]) {
            return false;
        }
    }
    return true;
}

function isCjkChar(ch) {
    return /[\u3400-\u9FFF]/.test(ch);
}

function containsCjkChars(text) {
    return /[\u3400-\u9FFF]/.test(normalizeDisplayText(text));
}

function buildPixelFontBitmap(text) {
    const upper = normalizeDisplayText(text).toUpperCase() || ' ';
    const glyphs = [];
    let width = 0;

    for (const ch of upper) {
        const glyph = PIXEL_FONT[ch] || PIXEL_FONT[' '];
        const glyphWidth = glyph[0].length;
        glyphs.push({ glyph, width: glyphWidth });
        width += glyphWidth;
    }
    if (glyphs.length > 1) {
        width += FONT_SPACING * (glyphs.length - 1);
    }

    const bitmap = Array.from({ length: FONT_HEIGHT }, () => Array(width).fill(0));
    let offsetX = 0;
    glyphs.forEach((item, idx) => {
        for (let y = 0; y < FONT_HEIGHT; y++) {
            const row = item.glyph[y] || '00000';
            for (let x = 0; x < item.width; x++) {
                if (row[x] === '1') {
                    bitmap[y][offsetX + x] = 1;
                }
            }
        }
        offsetX += item.width + (idx < glyphs.length - 1 ? FONT_SPACING : 0);
    });

    return { bitmap, width, height: FONT_HEIGHT };
}

function scaleBitmapToGrid(bitmap, sourceWidth, sourceHeight, targetCols, targetRows, minFillRatio = 0) {
    const scaleFactor = Math.max(sourceWidth / targetCols, sourceHeight / targetRows, 1);
    const targetW = Math.min(targetCols, Math.max(1, Math.floor(sourceWidth / scaleFactor)));
    const targetH = Math.min(targetRows, Math.max(1, Math.floor(sourceHeight / scaleFactor)));
    const fillRatio = clamp(minFillRatio, 0, 0.95);

    const scaled = Array.from({ length: targetRows }, () => Array(targetCols).fill(0));
    const startCol = Math.floor((targetCols - targetW) / 2);
    const startRow = Math.floor((targetRows - targetH) / 2);

    for (let ty = 0; ty < targetH; ty++) {
        const y0 = Math.floor(ty * scaleFactor);
        const y1 = Math.min(sourceHeight, Math.floor((ty + 1) * scaleFactor));

        for (let tx = 0; tx < targetW; tx++) {
            const x0 = Math.floor(tx * scaleFactor);
            const x1 = Math.min(sourceWidth, Math.floor((tx + 1) * scaleFactor));

            let onCount = 0;
            let totalCount = 0;
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    totalCount += 1;
                    if (bitmap[y][x]) {
                        onCount += 1;
                    }
                }
            }

            if (onCount > 0 && (onCount / Math.max(1, totalCount)) >= fillRatio) {
                scaled[startRow + ty][startCol + tx] = 1;
            }
        }
    }

    return scaled;
}

function thinBinaryGridZhangSuen(sourceGrid, maxPasses = 20) {
    const rows = sourceGrid.length;
    const cols = rows > 0 ? sourceGrid[0].length : 0;
    if (rows === 0 || cols === 0 || maxPasses <= 0) {
        return sourceGrid;
    }

    const grid = sourceGrid.map((row) => row.slice());
    const on = (r, c) => (
        r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] ? 1 : 0
    );

    let pass = 0;
    let changed = false;

    do {
        changed = false;
        let toDelete = [];

        for (let r = 1; r < rows - 1; r++) {
            for (let c = 1; c < cols - 1; c++) {
                if (!grid[r][c]) continue;

                const p2 = on(r - 1, c);
                const p3 = on(r - 1, c + 1);
                const p4 = on(r, c + 1);
                const p5 = on(r + 1, c + 1);
                const p6 = on(r + 1, c);
                const p7 = on(r + 1, c - 1);
                const p8 = on(r, c - 1);
                const p9 = on(r - 1, c - 1);
                const neighbors = [p2, p3, p4, p5, p6, p7, p8, p9];
                const n = neighbors.reduce((sum, v) => sum + v, 0);
                let s = 0;
                for (let i = 0; i < 8; i++) {
                    if (neighbors[i] === 0 && neighbors[(i + 1) % 8] === 1) {
                        s += 1;
                    }
                }

                if (
                    n >= 2 && n <= 6 &&
                    s === 1 &&
                    (p2 * p4 * p6 === 0) &&
                    (p4 * p6 * p8 === 0)
                ) {
                    toDelete.push([r, c]);
                }
            }
        }

        if (toDelete.length > 0) {
            changed = true;
            for (const [r, c] of toDelete) {
                grid[r][c] = 0;
            }
        }

        toDelete = [];
        for (let r = 1; r < rows - 1; r++) {
            for (let c = 1; c < cols - 1; c++) {
                if (!grid[r][c]) continue;

                const p2 = on(r - 1, c);
                const p3 = on(r - 1, c + 1);
                const p4 = on(r, c + 1);
                const p5 = on(r + 1, c + 1);
                const p6 = on(r + 1, c);
                const p7 = on(r + 1, c - 1);
                const p8 = on(r, c - 1);
                const p9 = on(r - 1, c - 1);
                const neighbors = [p2, p3, p4, p5, p6, p7, p8, p9];
                const n = neighbors.reduce((sum, v) => sum + v, 0);
                let s = 0;
                for (let i = 0; i < 8; i++) {
                    if (neighbors[i] === 0 && neighbors[(i + 1) % 8] === 1) {
                        s += 1;
                    }
                }

                if (
                    n >= 2 && n <= 6 &&
                    s === 1 &&
                    (p2 * p4 * p8 === 0) &&
                    (p2 * p6 * p8 === 0)
                ) {
                    toDelete.push([r, c]);
                }
            }
        }

        if (toDelete.length > 0) {
            changed = true;
            for (const [r, c] of toDelete) {
                grid[r][c] = 0;
            }
        }

        pass += 1;
    } while (changed && pass < maxPasses);

    return grid;
}

function getCjkTargetRows() {
    const configured = Math.floor(displayConfig.cjkTargetRows ?? 20);
    return clamp(Math.max(CJK_BASE_CELL_SIZE, configured), 12, 40);
}

function estimateContentWidthCells(text) {
    const content = normalizeDisplayText(text);
    if (!content) return 1;
    if (containsOnlyPixelFontChars(content)) {
        return buildPixelFontBitmap(content).width;
    }
    if (containsCjkChars(content)) {
        return buildCjkTextBitmap(content, getCjkTargetRows()).width;
    }
    const latinCount = Array.from(content).length;
    return Math.ceil(latinCount * 3.4);
}

function estimateContentHeightCells(text) {
    const content = normalizeDisplayText(text);
    if (!content) return 1;
    if (containsOnlyPixelFontChars(content)) {
        return FONT_HEIGHT;
    }
    if (containsCjkChars(content)) {
        return getCjkTargetRows();
    }
    return Math.max(8, Math.ceil(10 * clamp(displayConfig.textScale, 0.35, 1.0)));
}

function ensureDisplayGridCapacity(text) {
    if (!isDisplayMode() || !displayConfig.autoExpand) {
        return false;
    }
    const content = normalizeDisplayText(text);
    if (!content) {
        return false;
    }

    const currentRows = Math.max(1, Math.floor(config.gridRows));
    const currentCols = Math.max(1, Math.floor(config.gridCols));
    const maxRows = clamp(Math.floor(displayConfig.autoExpandMaxRows ?? 120), 12, 240);
    const maxCols = clamp(Math.floor(displayConfig.autoExpandMaxCols ?? 240), 20, 420);
    const hasCjk = containsCjkChars(content);
    const neededRows = Math.min(maxRows, estimateContentHeightCells(content) + (hasCjk ? 3 : 2));
    const neededCols = Math.min(maxCols, estimateContentWidthCells(content) + (hasCjk ? 4 : 2));

    let nextRows = currentRows;
    let nextCols = currentCols;
    if (neededRows > currentRows) {
        nextRows = neededRows;
    }
    if (neededCols > currentCols) {
        nextCols = neededCols;
    }

    if (nextRows === currentRows && nextCols === currentCols) {
        return false;
    }

    config.gridRows = nextRows;
    config.gridCols = nextCols;
    createPixelWall();
    return true;
}

function decideActiveColumns(text, totalCols) {
    const compactCols = clamp(Math.floor(displayConfig.compactCols), 4, Math.max(4, totalCols));
    if (!displayConfig.autoExpand) {
        return compactCols;
    }
    const neededCols = estimateContentWidthCells(text);
    return neededCols > compactCols ? totalCols : compactCols;
}

function waitMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateMusicHint(message) {
    const text = String(message || '音乐驱动：未加载音源');
    musicDriveUi.status = text;
    const hint = document.getElementById('music-hint');
    if (hint) {
        hint.textContent = text;
    }
}

function describeMediaError(mediaError) {
    if (!mediaError) {
        return '未知错误';
    }
    if (mediaError.code === 1) {
        return '加载被中止';
    }
    if (mediaError.code === 2) {
        return '网络错误';
    }
    if (mediaError.code === 3) {
        return '媒体解码失败';
    }
    if (mediaError.code === 4) {
        return '链接或格式不受支持';
    }
    return '媒体加载失败';
}

function revokeMusicObjectUrl() {
    if (musicDriveState.objectUrl) {
        URL.revokeObjectURL(musicDriveState.objectUrl);
        musicDriveState.objectUrl = '';
    }
}

function ensureMusicAudioElement() {
    if (musicDriveState.audioEl) {
        return musicDriveState.audioEl;
    }
    const audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.playsInline = true;
    audio.loop = !!musicDriveConfig.sourceLoop;
    audio.addEventListener('error', () => {
        stopMusicDrive({ keepSource: true, pauseAudio: true, silentStatus: true });
        updateMusicHint(`音乐驱动：${describeMediaError(audio.error)}`);
        updateTransportUi();
    });
    audio.addEventListener('timeupdate', updateTransportUi);
    audio.addEventListener('durationchange', updateTransportUi);
    audio.addEventListener('play', updateTransportUi);
    audio.addEventListener('pause', updateTransportUi);
    audio.addEventListener('ended', updateTransportUi);
    audio.addEventListener('loadedmetadata', updateTransportUi);
    audio.addEventListener('loadeddata', updateTransportUi);
    audio.addEventListener('canplay', updateTransportUi);
    audio.addEventListener('progress', updateTransportUi);
    musicDriveState.audioEl = audio;
    return audio;
}

async function ensureMusicAnalyser() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
        throw new Error('当前浏览器不支持 Web Audio API');
    }

    const audio = ensureMusicAudioElement();
    if (!musicDriveState.audioContext) {
        musicDriveState.audioContext = new AudioContextCtor();
    }

    const ctx = musicDriveState.audioContext;
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }

    if (!musicDriveState.sourceNode) {
        musicDriveState.sourceNode = ctx.createMediaElementSource(audio);
    }

    if (!musicDriveState.analyser) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.62;
        musicDriveState.analyser = analyser;
        musicDriveState.timeData = new Uint8Array(analyser.fftSize);
        musicDriveState.freqData = new Uint8Array(analyser.frequencyBinCount);
    }

    if (!musicDriveState.graphConnected) {
        musicDriveState.sourceNode.connect(musicDriveState.analyser);
        musicDriveState.analyser.connect(ctx.destination);
        musicDriveState.graphConnected = true;
    }
}

function pickLocalMusicFile() {
    const input = document.getElementById('music-file-input');
    if (!input) {
        updateMusicHint('音乐驱动：未找到文件选择器');
        return;
    }
    input.click();
}

function isPageVideoLink(url) {
    return /(youtube\.com|youtu\.be|bilibili\.com|douyin\.com|kuaishou\.com)/i.test(url);
}

async function loadMusicFromUrl(options = {}) {
    const opts = (options && typeof options === 'object') ? options : {};
    const urlFromArg = typeof options === 'string' ? options : opts.url;
    const url = String(urlFromArg || musicDriveConfig.sourceUrl || '').trim();
    if (!url) {
        updateMusicHint('音乐驱动：请先输入音频/视频直链');
        return;
    }
    if (isPageVideoLink(url)) {
        updateMusicHint('音乐驱动：该平台页面链接需先转成直链(mp3/mp4/m3u8)');
        return;
    }

    stopMusicDrive({ keepSource: true, pauseAudio: true });
    revokeMusicObjectUrl();

    const audio = ensureMusicAudioElement();
    audio.loop = !!musicDriveConfig.sourceLoop;
    audio.src = url;
    audio.load();
    updateTransportUi();
    musicDriveConfig.sourceUrl = url;
    const trackName = String(opts.trackName || '').trim();
    updateMusicHint(`音乐驱动：已加载 ${trackName || '链接音频'}`);

    const shouldStart = opts.startAfterLoad === true
        || (opts.startAfterLoad !== false && musicDriveConfig.autoPlayAfterLoad);
    if (shouldStart) {
        await startMusicExperience(trackName || '在线音频');
    }
}

async function loadMusicFromFile(file, options = {}) {
    if (!file) {
        return;
    }
    const opts = (options && typeof options === 'object') ? options : {};
    stopMusicDrive({ keepSource: true, pauseAudio: true });
    revokeMusicObjectUrl();

    const objectUrl = URL.createObjectURL(file);
    musicDriveState.objectUrl = objectUrl;
    const audio = ensureMusicAudioElement();
    audio.loop = !!musicDriveConfig.sourceLoop;
    audio.src = objectUrl;
    audio.load();
    updateTransportUi();
    const trackName = String(opts.trackName || file.name || '本地音频').trim();
    updateMusicHint(`音乐驱动：已加载本地文件 ${trackName}`);

    const shouldStart = opts.startAfterLoad === true
        || (opts.startAfterLoad !== false && musicDriveConfig.autoPlayAfterLoad);
    if (shouldStart) {
        await startMusicExperience(trackName);
    }
}

function setupMusicFilePicker() {
    const input = document.getElementById('music-file-input');
    if (!input || input.dataset.bound === '1') {
        return;
    }
    input.dataset.bound = '1';
    input.addEventListener('change', async (event) => {
        const target = event.target;
        const file = target && target.files && target.files[0] ? target.files[0] : null;
        if (file) {
            await loadMusicFromFile(file, {
                startAfterLoad: true,
                trackName: file.name
            });
        }
        if (target) {
            target.value = '';
        }
    });
}

function mapMusicEnergyToEffects(energy) {
    const clampedEnergy = clamp(energy, 0, 1);
    const minInterval = clamp(musicDriveConfig.minRowIntervalMs, 0, 800);
    const maxInterval = clamp(Math.max(minInterval, musicDriveConfig.maxRowIntervalMs), minInterval, 800);
    springWaveConfig.rowIntervalMs = Math.round(maxInterval - (maxInterval - minInterval) * clampedEnergy);
    springWaveConfig.stagePauseMs = Math.round(220 - 180 * clampedEnergy);
    springWaveConfig.innerDelayMs = Math.round(22 - 18 * clampedEnergy);
    springWaveConfig.damping = clamp(
        musicDriveConfig.minDamping + (musicDriveConfig.maxDamping - musicDriveConfig.minDamping) * clampedEnergy,
        0.04,
        0.25
    );

    if (springWaveConfig.effect === '效果3-扫光') {
        sweepLightConfig.intensity = clamp(2.4 + clampedEnergy * 8.4, 0.5, 12);
        sweepLightConfig.durationMs = Math.round(4200 - 3200 * clampedEnergy);
        updateSweepLightParams();
    }
}

function calculateBandAverage(data, start, end) {
    const safeStart = Math.max(0, Math.min(data.length - 1, Math.floor(start)));
    const safeEnd = Math.max(safeStart + 1, Math.min(data.length, Math.floor(end)));
    let sum = 0;
    for (let i = safeStart; i < safeEnd; i++) {
        sum += data[i];
    }
    return sum / (safeEnd - safeStart) / 255;
}

function updateMusicDrivenEffects() {
    if (!musicDriveState.running || !musicDriveState.analyser || !musicDriveState.audioEl) {
        return;
    }

    const audio = musicDriveState.audioEl;
    if (!isSpringFestivalMode()) {
        stopMusicDrive({ keepSource: true, pauseAudio: true });
        return;
    }
    if (audio.paused) {
        return;
    }

    const analyser = musicDriveState.analyser;
    const timeData = musicDriveState.timeData;
    const freqData = musicDriveState.freqData;
    analyser.getByteTimeDomainData(timeData);
    analyser.getByteFrequencyData(freqData);

    let sumSquares = 0;
    for (let i = 0; i < timeData.length; i++) {
        const value = (timeData[i] - 128) / 128;
        sumSquares += value * value;
    }
    const rms = Math.sqrt(sumSquares / timeData.length);

    const lowEnd = Math.max(1, Math.floor(freqData.length * 0.12));
    const midEnd = Math.max(lowEnd + 1, Math.floor(freqData.length * 0.46));
    const low = calculateBandAverage(freqData, 0, lowEnd);
    const mid = calculateBandAverage(freqData, lowEnd, midEnd);
    const high = calculateBandAverage(freqData, midEnd, freqData.length);
    const spectral = low * 0.52 + mid * 0.33 + high * 0.15;
    const rawEnergy = clamp((rms * 0.7 + spectral * 0.9) * musicDriveConfig.gainBoost, 0, 1);

    const smoothing = clamp(musicDriveConfig.smoothing, 0.2, 0.95);
    const prevEnergy = musicDriveState.smoothedEnergy;
    const smoothedEnergy = prevEnergy * smoothing + rawEnergy * (1 - smoothing);
    musicDriveState.smoothedEnergy = smoothedEnergy;

    mapMusicEnergyToEffects(smoothedEnergy);

    const now = performance.now();
    const beatThreshold = clamp(musicDriveConfig.beatThreshold, 0.08, 0.95);
    const fluxThreshold = clamp(musicDriveConfig.beatFluxThreshold, 0.005, 0.2);
    const cooldown = clamp(musicDriveConfig.beatCooldownMs, 80, 1200);
    const flux = smoothedEnergy - prevEnergy;
    musicDriveState.lowBand = low;
    musicDriveState.midBand = mid;
    musicDriveState.highBand = high;
    musicDriveState.energyFlux = flux;
    const isBeat = smoothedEnergy >= beatThreshold
        && flux >= fluxThreshold
        && now - musicDriveState.lastBeatAt >= cooldown;

    if (isBeat) {
        const prevBeatAt = musicDriveState.lastBeatAt;
        if (prevBeatAt > 0) {
            const nextInterval = now - prevBeatAt;
            if (nextInterval >= 220 && nextInterval <= 1800) {
                musicDriveState.prevBeatAt = prevBeatAt;
                musicDriveState.beatIntervalMs = nextInterval;
                const smoothBase = musicDriveState.smoothedBeatIntervalMs > 0
                    ? musicDriveState.smoothedBeatIntervalMs
                    : nextInterval;
                musicDriveState.smoothedBeatIntervalMs = smoothBase * 0.72 + nextInterval * 0.28;
            }
        }
        musicDriveState.lastBeatAt = now;

        const fluxNorm = clamp(Math.max(0, flux) * 8, 0, 1);
        const kickScore = smoothedEnergy * 0.5 + low * 0.34 + fluxNorm * 0.16;
        if (kickScore >= 0.62 && low >= 0.38) {
            musicDriveState.strongBeatAt = now;
            musicDriveState.strongBeatStrength = clamp((kickScore - 0.55) * 2.1, 0.16, 1);
        }
    }

    const triggerInterval = clamp(musicDriveConfig.triggerIntervalMs, 80, 3000);
    if (musicDriveConfig.autoTrigger && isBeat && now - musicDriveState.lastTriggerAt >= triggerInterval) {
        musicDriveState.lastTriggerAt = now;
        if (!springWaveState.running) {
            startSpringWave();
        }
    }

    if (now - musicDriveState.lastUiAt >= 180) {
        musicDriveState.lastUiAt = now;
        const beatInterval = musicDriveState.smoothedBeatIntervalMs > 0
            ? musicDriveState.smoothedBeatIntervalMs
            : musicDriveState.beatIntervalMs;
        const bpmText = beatInterval > 0
            ? ` BPM${(60000 / beatInterval).toFixed(0)}`
            : '';
        updateMusicHint(
            `音乐驱动：电平${smoothedEnergy.toFixed(2)} 低${low.toFixed(2)} 中${mid.toFixed(2)} 高${high.toFixed(2)} 节拍${isBeat ? '1' : '0'}${bpmText}`
        );
    }
}

async function startMusicDrive() {
    if (!isSpringFestivalMode()) {
        updateMusicHint('音乐驱动：请先切换到春晚模式');
        updateTransportUi();
        return;
    }

    const audio = ensureMusicAudioElement();
    if (!audio.src) {
        updateMusicHint('音乐驱动：请先加载链接或上传本地文件');
        updateTransportUi();
        return;
    }

    try {
        await ensureMusicAnalyser();
        audio.loop = !!musicDriveConfig.sourceLoop;
        await audio.play();
        musicDriveState.running = true;
        musicDriveState.smoothedEnergy = 0;
        musicDriveState.lowBand = 0;
        musicDriveState.midBand = 0;
        musicDriveState.highBand = 0;
        musicDriveState.energyFlux = 0;
        musicDriveState.lastBeatAt = 0;
        musicDriveState.strongBeatAt = 0;
        musicDriveState.strongBeatStrength = 0;
        musicDriveState.prevBeatAt = 0;
        musicDriveState.beatIntervalMs = 0;
        musicDriveState.smoothedBeatIntervalMs = 0;
        musicDriveState.lastTriggerAt = 0;
        musicDriveState.lastUiAt = 0;
        updateMusicHint('音乐驱动：已启动，正在解析频谱...');
        setPanelVisible(false);
        updateTransportUi();
    } catch (error) {
        const message = error && error.message ? error.message : '播放启动失败';
        updateMusicHint(`音乐驱动：${message}`);
        musicDriveState.running = false;
        updateTransportUi();
    }
}

function stopMusicDrive(options = {}) {
    const keepSource = options.keepSource !== false;
    const pauseAudio = options.pauseAudio !== false;
    const silentStatus = options.silentStatus === true;
    stopMusicOrchestration();
    musicDriveState.running = false;
    musicDriveState.smoothedEnergy = 0;
    musicDriveState.lowBand = 0;
    musicDriveState.midBand = 0;
    musicDriveState.highBand = 0;
    musicDriveState.energyFlux = 0;
    musicDriveState.lastBeatAt = 0;
    musicDriveState.strongBeatAt = 0;
    musicDriveState.strongBeatStrength = 0;
    musicDriveState.prevBeatAt = 0;
    musicDriveState.beatIntervalMs = 0;
    musicDriveState.smoothedBeatIntervalMs = 0;
    musicDriveState.lastTriggerAt = 0;

    if (pauseAudio && musicDriveState.audioEl) {
        musicDriveState.audioEl.pause();
    }

    if (!keepSource && musicDriveState.audioEl) {
        musicDriveState.audioEl.removeAttribute('src');
        musicDriveState.audioEl.load();
        revokeMusicObjectUrl();
        if (silentStatus) {
            return;
        }
        setExperienceUiPlaying(false);
        updateMusicHint('音乐驱动：已停止并清空音源');
        updateExperienceStatus('请选择一首音乐开始编排');
        updateTransportUi();
        return;
    }

    if (silentStatus) {
        return;
    }
    setExperienceUiPlaying(false);
    updateMusicHint('音乐驱动：已停止（音源保留）');
    updateExperienceStatus('音乐已停止，可重新开始编排');
    updateTransportUi();
}

function resetPixelsToInitialFace() {
    clearAllTrackColorOverrides();
    for (const group of pixels) {
        if (!group || !group.userData || group.userData.isRim) {
            continue;
        }
        queueGroupToFace(group, 0, { immediate: true });
    }
}

function stopSpringWave(options = {}) {
    const shouldReset = options.resetPose === true;
    springWaveState.running = false;
    springWaveState.runId += 1;
    for (const item of sweepLights) {
        item.light.visible = false;
        item.light.intensity = 0;
    }
    if (shouldReset) {
        resetPixelsToInitialFace();
    }
}

function getSpringActiveRows() {
    const rows = Math.max(1, Math.floor(config.gridRows));
    const ordered = [];
    for (let row = 0; row < rows; row++) {
        if (activeMask[row] && activeMask[row].some((v) => v === 1)) {
            ordered.push(row);
        }
    }
    if (springWaveConfig.direction === '从下到上') {
        ordered.reverse();
    }
    return ordered;
}

function normalizeFaceIndex(face) {
    const v = Number.isFinite(face) ? Math.floor(face) : 0;
    return ((v % 3) + 3) % 3;
}

function getGroupPendingFaceIndex(group) {
    if (!group || !group.userData) {
        return 0;
    }
    if (Number.isFinite(group.userData.targetFaceIndex)) {
        return normalizeFaceIndex(group.userData.targetFaceIndex);
    }
    if (Number.isFinite(group.userData.faceIndex)) {
        return normalizeFaceIndex(group.userData.faceIndex);
    }
    return 0;
}

function queueGroupToFace(group, targetFace, options = {}) {
    if (!group || !group.userData) {
        return false;
    }
    const safeFace = normalizeFaceIndex(targetFace);
    const baseRotationX = Number.isFinite(group.userData.baseRotationX)
        ? group.userData.baseRotationX
        : config.initRotationX;
    const immediate = options.immediate === true;
    const damping = Number.isFinite(options.damping)
        ? clamp(options.damping, 0.04, 0.25)
        : null;

    if (immediate) {
        const targetRotation = baseRotationX + safeFace * (Math.PI * 2 / 3);
        group.rotation.x = targetRotation;
        group.userData.targetRotationX = targetRotation;
        group.userData.faceIndex = safeFace;
        group.userData.targetFaceIndex = safeFace;
        group.userData.currentOn = safeFace !== 0;
        group.userData.targetOn = safeFace !== 0;
        group.userData.isAnimating = false;
        group.userData.motionDamping = null;
        return true;
    }

    const pendingFace = getGroupPendingFaceIndex(group);
    const steps = (safeFace - pendingFace + 3) % 3;
    const nextTargetOn = safeFace !== 0;
    if (steps === 0 && group.userData.targetOn === nextTargetOn) {
        return false;
    }

    const anchorRotation = (group.userData.isAnimating && Number.isFinite(group.userData.targetRotationX))
        ? group.userData.targetRotationX
        : group.rotation.x;

    group.userData.targetRotationX = anchorRotation + steps * ((Math.PI * 2) / 3);
    group.userData.targetFaceIndex = safeFace;
    group.userData.targetOn = nextTargetOn;
    group.userData.isAnimating = steps > 0;
    if (damping !== null) {
        group.userData.motionDamping = damping;
    }
    return steps > 0;
}

function queueGroupStepFlip(group, steps, damping = null) {
    const safeSteps = ((Math.floor(steps || 0) % 3) + 3) % 3;
    if (safeSteps === 0) {
        return false;
    }
    const nextFace = (getGroupPendingFaceIndex(group) + safeSteps) % 3;
    return queueGroupToFace(group, nextFace, { immediate: false, damping });
}

function triggerRowFlip(row, steps, dampingOverride = null) {
    const cols = Math.max(1, Math.floor(config.gridCols));
    const damping = Number.isFinite(dampingOverride)
        ? clamp(dampingOverride, 0.04, 0.25)
        : springWaveConfig.damping;
    for (let col = 0; col < cols; col++) {
        if (!activeMask[row] || activeMask[row][col] !== 1) {
            continue;
        }
        const group = getPixelByGrid(row, col);
        if (!group || group.userData.isRim) {
            continue;
        }
        queueGroupStepFlip(group, steps, damping);
    }
}

function getRowActiveColumns(row) {
    const cols = Math.max(1, Math.floor(config.gridCols));
    const ordered = [];
    for (let col = 0; col < cols; col++) {
        if (activeMask[row] && activeMask[row][col] === 1) {
            ordered.push(col);
        }
    }
    if (springWaveConfig.innerDirection === '从右到左') {
        ordered.reverse();
    }
    return ordered;
}

function triggerSinglePixelFlip(row, col, steps, dampingOverride = null) {
    const group = getPixelByGrid(row, col);
    if (!group || group.userData.isRim) {
        return;
    }
    const damping = Number.isFinite(dampingOverride)
        ? clamp(dampingOverride, 0.04, 0.25)
        : springWaveConfig.damping;
    queueGroupStepFlip(group, steps, damping);
}

function buildEqualizerBars() {
    const rows = Math.max(1, Math.floor(config.gridRows));
    const cols = Math.max(1, Math.floor(config.gridCols));
    const columns = [];

    for (let col = 0; col < cols; col++) {
        const activeRows = [];
        for (let row = 0; row < rows; row++) {
            if (activeMask[row] && activeMask[row][col] === 1) {
                activeRows.push(row);
            }
        }
        if (!activeRows.length) {
            continue;
        }

        columns.push({
            col,
            rowsBottomToTop: activeRows.slice().reverse()
        });
    }

    if (columns.length === 0) {
        return [];
    }

    const maxColumnLevels = Math.max(...columns.map((column) => column.rowsBottomToTop.length));
    const areaRatio = clamp(Number(springWaveConfig.equalizerAreaRatio), 0.2, 1);
    const desiredLevels = clamp(Math.floor(maxColumnLevels * areaRatio), 4, Math.max(4, maxColumnLevels));

    const requestedBars = clamp(Math.floor(Number(springWaveConfig.equalizerBars)), 8, 64);
    const barCount = Math.max(1, Math.min(requestedBars, columns.length));
    const bars = [];
    for (let i = 0; i < barCount; i++) {
        const start = Math.floor(i * columns.length / barCount);
        const end = Math.max(start + 1, Math.floor((i + 1) * columns.length / barCount));
        const bucket = columns.slice(start, end);
        if (!bucket.length) {
            continue;
        }
        const maxLevels = clamp(desiredLevels, 1, Math.max(...bucket.map((column) => column.rowsBottomToTop.length)));
        const trimmed = bucket.map((column) => ({
            col: column.col,
            rowsBottomToTop: column.rowsBottomToTop.slice(0, maxLevels)
        }));
        bars.push({
            columns: trimmed,
            maxLevels
        });
    }
    return bars;
}

function resetEqualizerBars(bars) {
    for (const bar of bars) {
        for (const column of bar.columns) {
            for (const row of column.rowsBottomToTop) {
                const group = getPixelByGrid(row, column.col);
                if (!group || group.userData.isRim) {
                    continue;
                }
                queueGroupToFace(group, 0, { immediate: true });
            }
        }
    }
}

function sampleEqualizerBandEnergy(freqData, bandIndex, totalBands) {
    if (!freqData || !freqData.length || totalBands <= 0) {
        return 0;
    }
    const safeIndex = clamp(Math.floor(bandIndex), 0, totalBands - 1);
    const startNorm = Math.pow(safeIndex / totalBands, 1.65);
    const endNorm = Math.pow((safeIndex + 1) / totalBands, 1.65);
    const start = Math.floor(startNorm * freqData.length);
    const end = Math.ceil(endNorm * freqData.length);
    return calculateBandAverage(freqData, start, end);
}

function applyBarHeightChange(bar, fromHeight, toHeight, damping) {
    const maxLevels = bar.maxLevels;
    const safeFrom = clamp(Math.floor(fromHeight), 0, maxLevels);
    const safeTo = clamp(Math.floor(toHeight), 0, maxLevels);
    if (safeFrom === safeTo) {
        return;
    }
    if (safeTo > safeFrom) {
        for (let level = safeFrom; level < safeTo; level++) {
            for (const column of bar.columns) {
                const row = column.rowsBottomToTop[level];
                if (!Number.isFinite(row)) {
                    continue;
                }
                const group = getPixelByGrid(row, column.col);
                if (!group || group.userData.isRim) {
                    continue;
                }
                queueGroupStepFlip(group, 2, damping); // 上升：先翻两面
            }
        }
        return;
    }
    for (let level = safeTo; level < safeFrom; level++) {
        for (const column of bar.columns) {
            const row = column.rowsBottomToTop[level];
            if (!Number.isFinite(row)) {
                continue;
            }
            const group = getPixelByGrid(row, column.col);
            if (!group || group.userData.isRim) {
                continue;
            }
            queueGroupStepFlip(group, 1, damping); // 回落：补翻一面
        }
    }
}

function isMusicSnapshotReady() {
    return !!(
        musicDriveState.running
        && musicDriveState.audioEl
        && !musicDriveState.audioEl.paused
        && musicDriveState.freqData
        && musicDriveState.freqData.length > 0
    );
}

function getEqualizerRandomTarget(now, phaseOffset, speed, randomness) {
    const primary = 0.5 + 0.5 * Math.sin(now * speed + phaseOffset);
    const secondary = 0.5 + 0.5 * Math.sin(now * speed * 1.18 + phaseOffset * 0.83);
    const noise = (Math.random() * 2 - 1) * randomness * 0.18;
    return clamp(primary * 0.72 + secondary * 0.23 + 0.05 + noise, 0, 1);
}

function buildEqualizerBandOrder(count) {
    const order = Array.from({ length: count }, (_, index) => index);
    if (count <= 2) {
        return order;
    }
    const maxStep = Math.max(2, Math.floor(count * 0.14));
    for (let i = 0; i < count; i++) {
        const offset = Math.floor((Math.random() * 2 - 1) * maxStep);
        const j = clamp(i + offset, 0, count - 1);
        const tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
    }
    return order;
}

function applyBarFaceTargets(bar, activeHeight, tick, damping, motionStrength) {
    const safeHeight = clamp(Math.floor(activeHeight), 0, bar.maxLevels);
    const motion = clamp(motionStrength, 0, 1);
    const stride = clamp(Math.round(5 - motion * 4), 1, 5);
    for (let level = 0; level < bar.maxLevels; level++) {
        const isVisible = level < safeHeight;
        for (let colIndex = 0; colIndex < bar.columns.length; colIndex++) {
            const column = bar.columns[colIndex];
            const row = column.rowsBottomToTop[level];
            if (!Number.isFinite(row)) {
                continue;
            }
            const group = getPixelByGrid(row, column.col);
            if (!group || group.userData.isRim) {
                continue;
            }

            let targetFace = 0;
            if (isVisible) {
                targetFace = 2;
                if (motion > 0) {
                    const patternHit = ((tick + level + colIndex) % stride) === 0;
                    if (patternHit) {
                        const depthNorm = 1 - (level / Math.max(1, safeHeight - 1));
                        const pulseChance = clamp(motion * (0.38 + 0.62 * depthNorm), 0, 1);
                        if (Math.random() < pulseChance) {
                            targetFace = 1;
                        }
                    }
                }
            }

            queueGroupToFace(group, targetFace, {
                immediate: false,
                damping
            });
        }
    }
}

function getEqualizerTempoProfile(baseUpdateMs, baseAttack, baseDecay, baseDamping, baseBodyMotion) {
    const baseMs = clamp(Math.floor(Number(baseUpdateMs)), 40, 500);
    const baseAtk = clamp(Number(baseAttack), 0.15, 0.98);
    const baseDec = clamp(Number(baseDecay), 0.01, 0.4);
    const baseDamp = clamp(Number(baseDamping), 0.04, 0.25);
    const baseBody = clamp(Number(baseBodyMotion), 0, 1);
    const syncMode = String(springWaveConfig.equalizerTempoSync || '关闭');

    if (syncMode === '关闭' || !isMusicSnapshotReady()) {
        return {
            updateMs: baseMs,
            attack: baseAtk,
            decayPerTick: clamp(baseDec * (baseMs / 120), 0.005, 0.6),
            damping: baseDamp,
            bodyMotion: baseBody,
            beatPulse: 0
        };
    }

    const strength = clamp(Number(springWaveConfig.equalizerSyncStrength), 0, 1);
    const syncMinRaw = Math.floor(Number(springWaveConfig.equalizerSyncMinMs));
    const syncMaxRaw = Math.floor(Number(springWaveConfig.equalizerSyncMaxMs));
    const syncMin = clamp(syncMinRaw, 24, 700);
    const syncMax = clamp(Math.max(syncMin + 1, syncMaxRaw), syncMin + 1, 700);
    const beatPulseStrength = clamp(Number(springWaveConfig.equalizerBeatPulse), 0, 1);
    const energy = clamp(Number(musicDriveState.smoothedEnergy), 0, 1);
    const flux = clamp(Math.max(0, Number(musicDriveState.energyFlux) * 8), 0, 1);

    let syncedMs = baseMs;
    let beatPulse = 0;
    if (syncMode === '跟随音频能量') {
        const drive = clamp(energy * 0.66 + flux * 0.34, 0, 1);
        syncedMs = Math.round(syncMax - (syncMax - syncMin) * drive);
    } else {
        const beatIntervalRaw = musicDriveState.smoothedBeatIntervalMs > 0
            ? musicDriveState.smoothedBeatIntervalMs
            : musicDriveState.beatIntervalMs;
        const beatInterval = clamp(Number(beatIntervalRaw), 0, 1800);
        const beatAge = performance.now() - Number(musicDriveState.lastBeatAt || 0);

        if (beatInterval >= 220) {
            const tempoBase = clamp(beatInterval, 250, 1500);
            const subdivisions = clamp(2.28 - energy * 0.82, 1.35, 2.28);
            const pulseWindow = clamp(tempoBase * 0.45, 100, 460);
            beatPulse = clamp(1 - beatAge / pulseWindow, 0, 1);
            const tempoMs = tempoBase / subdivisions;
            const pulseAdjusted = tempoMs * (1 - beatPulse * beatPulseStrength * 0.42);
            const fluxAdjusted = pulseAdjusted * (1 - flux * 0.16);
            syncedMs = Math.round(clamp(fluxAdjusted, syncMin, syncMax));
        } else {
            const drive = clamp(energy * 0.45 + flux * 0.22, 0, 1);
            syncedMs = Math.round(syncMax - (syncMax - syncMin) * drive * 0.76);
            beatPulse = clamp(flux * 0.4, 0, 1);
        }
    }

    const mixedMs = clamp(
        Math.round(baseMs * (1 - strength) + syncedMs * strength),
        24,
        700
    );
    const tempoFactor = clamp(baseMs / Math.max(1, mixedMs), 0.5, 2.8);
    const attack = clamp(baseAtk * (1 + (tempoFactor - 1) * 0.6), 0.15, 0.99);
    const decay = clamp(baseDec * (1 + (tempoFactor - 1) * 0.9), 0.01, 0.5);
    const damping = clamp(baseDamp * (1 + (tempoFactor - 1) * 0.55), 0.04, 0.25);
    const bodyBoost = clamp(beatPulse * beatPulseStrength * 0.55 + flux * 0.18, 0, 0.55);
    const bodyMotion = clamp(baseBody * (1 + strength * 0.3) + bodyBoost, 0, 1);

    return {
        updateMs: mixedMs,
        attack,
        decayPerTick: clamp(decay * (mixedMs / 120), 0.005, 0.6),
        damping,
        bodyMotion,
        beatPulse
    };
}

async function playColumnEqualizerEffect(runId) {
    const bars = buildEqualizerBars();
    if (!bars.length) {
        return;
    }

    const baseAttack = clamp(Number(springWaveConfig.equalizerAttack), 0.15, 0.98);
    const baseDecay = clamp(Number(springWaveConfig.equalizerDecay), 0.01, 0.4);
    const smoothing = clamp(Number(springWaveConfig.equalizerSmoothing), 0.05, 0.92);
    const baseUpdateMs = clamp(Math.floor(Number(springWaveConfig.equalizerUpdateMs)), 40, 500);
    const minRatio = clamp(Number(springWaveConfig.equalizerMinRatio), 0, 0.9);
    const maxRatio = clamp(Math.max(minRatio + 0.02, Number(springWaveConfig.equalizerMaxRatio)), 0.02, 1);
    const randomness = clamp(Number(springWaveConfig.equalizerRandomness), 0, 0.95);
    const audioGain = clamp(Number(springWaveConfig.equalizerAudioGain), 0.5, 3);
    const fluxGain = clamp(Number(springWaveConfig.equalizerFluxGain), 0, 6);
    const spectrumBalance = clamp(Number(springWaveConfig.equalizerSpectrumBalance), 0, 2);
    const baseBodyMotion = clamp(Number(springWaveConfig.equalizerBodyMotion), 0, 1);
    const baseDamping = clamp(Number(springWaveConfig.damping), 0.04, 0.25);
    const beatPulseStrength = clamp(Number(springWaveConfig.equalizerBeatPulse), 0, 1);
    const driveMode = String(springWaveConfig.equalizerDrive || '随机波动');

    const smoothRatios = new Array(bars.length).fill(0);
    const levelRatios = new Array(bars.length).fill(0);
    const bandBaselines = new Array(bars.length).fill(0.22);
    const bandOrder = buildEqualizerBandOrder(bars.length);
    const phaseOffsets = bars.map((_, index) => Math.random() * Math.PI * 2 + index * 0.21);
    const phaseSpeeds = bars.map(() => 0.0009 + Math.random() * 0.0014);
    let tick = 0;

    if (springWaveConfig.equalizerResetOnStart) {
        resetEqualizerBars(bars);
    }

    let announcedFallback = false;
    while (springWaveState.running && runId === springWaveState.runId) {
        const now = performance.now();
        const tempoProfile = getEqualizerTempoProfile(
            baseUpdateMs,
            baseAttack,
            baseDecay,
            baseDamping,
            baseBodyMotion
        );
        const musicReady = isMusicSnapshotReady();
        const useAudio = driveMode !== '随机波动' && musicReady;
        if (driveMode !== '随机波动' && !musicReady && !announcedFallback) {
            announcedFallback = true;
            updateMusicHint('柱形均衡波：未检测到音频解析，已自动退回随机波动');
        }

        const low = useAudio ? clamp(musicDriveState.lowBand, 0, 1) : 0;
        const mid = useAudio ? clamp(musicDriveState.midBand, 0, 1) : 0;
        const high = useAudio ? clamp(musicDriveState.highBand, 0, 1) : 0;
        const energy = useAudio ? clamp(musicDriveState.smoothedEnergy, 0, 1) : 0;
        const flux = useAudio ? Math.max(0, musicDriveState.energyFlux) : 0;
        const freqData = useAudio ? musicDriveState.freqData : null;
        const shapeExponent = useAudio
            ? clamp(1.28 - high * 0.82 + low * 0.35 - flux * fluxGain * 0.35, 0.62, 2.1)
            : 1.0;
        const indicatorShapeBoost = clamp(0.82 + (mid - low) * 0.6 + (high - mid) * 0.35 + flux * 3.2, 0.25, 1.85);

        for (let i = 0; i < bars.length; i++) {
            const mappedBandIndex = bandOrder[i];
            const progress = bars.length > 1 ? mappedBandIndex / (bars.length - 1) : 0;
            const randomTarget = getEqualizerRandomTarget(now, phaseOffsets[i], phaseSpeeds[i], randomness);
            let target = randomTarget;

            if (useAudio && freqData) {
                const band = sampleEqualizerBandEnergy(freqData, mappedBandIndex, bars.length);
                const freqCompensation = 1 + spectrumBalance * progress * 0.75;
                const compensatedBand = clamp(band * audioGain * freqCompensation, 0, 1);
                const shapedBand = Math.pow(compensatedBand, shapeExponent);
                bandBaselines[i] = bandBaselines[i] * 0.975 + shapedBand * 0.025;
                const normalizedBand = clamp(shapedBand / Math.max(0.08, bandBaselines[i] * 1.05), 0, 1);
                const modeTarget = driveMode === '指标驱动'
                    ? clamp(
                        normalizedBand * indicatorShapeBoost * (0.86 + 0.14 * Math.sin(progress * Math.PI))
                        + energy * 0.18
                        + flux * 0.12,
                        0,
                        1
                    )
                    : clamp(normalizedBand + energy * 0.12 + flux * 0.08, 0, 1);
                const blendRandom = clamp(randomness * 0.35, 0, 0.35);
                target = clamp(modeTarget * (1 - blendRandom) + randomTarget * blendRandom, 0, 1);
                const pulseShape = 0.72 + 0.28 * Math.sin(progress * Math.PI);
                const beatBoost = 1 + tempoProfile.beatPulse * beatPulseStrength * pulseShape;
                target = clamp(target * beatBoost, 0, 1);
            }

            const ratio = minRatio + (maxRatio - minRatio) * target;
            smoothRatios[i] = smoothRatios[i] * smoothing + ratio * (1 - smoothing);
            if (smoothRatios[i] >= levelRatios[i]) {
                levelRatios[i] += (smoothRatios[i] - levelRatios[i]) * tempoProfile.attack;
            } else {
                levelRatios[i] = Math.max(0, levelRatios[i] - tempoProfile.decayPerTick);
            }
            const maxLevels = bars[i].maxLevels;
            const nextLevel = clamp(Math.round(levelRatios[i] * maxLevels), 0, maxLevels);
            applyBarFaceTargets(
                bars[i],
                nextLevel,
                tick,
                tempoProfile.damping,
                tempoProfile.bodyMotion
            );
        }

        tick += 1;
        await waitMs(tempoProfile.updateMs);
    }
}

function randomInt(min, max) {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    if (high <= low) {
        return low;
    }
    return low + Math.floor(Math.random() * (high - low + 1));
}

function shuffleInPlace(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
    }
    return list;
}

function isActiveAndUnassignedCell(row, col, assigned) {
    return !!(
        activeMask[row]
        && activeMask[row][col] === 1
        && assigned[row]
        && assigned[row][col] !== 1
    );
}

function isHorizontalPairAvailable(topRow, col, assigned) {
    return (
        isActiveAndUnassignedCell(topRow, col, assigned)
        && isActiveAndUnassignedCell(topRow + 1, col, assigned)
    );
}

function isVerticalPairAvailable(row, leftCol, assigned) {
    return (
        isActiveAndUnassignedCell(row, leftCol, assigned)
        && isActiveAndUnassignedCell(row, leftCol + 1, assigned)
    );
}

function buildHorizontalRectCandidate(row, col, assigned, minLen, maxLen) {
    const rows = activeMask.length;
    const cols = rows > 0 ? activeMask[0].length : 0;
    const candidates = [];

    for (const topRow of [row - 1, row]) {
        if (topRow < 0 || topRow + 1 >= rows) {
            continue;
        }
        if (!isHorizontalPairAvailable(topRow, col, assigned)) {
            continue;
        }

        let left = col;
        while (left - 1 >= 0 && isHorizontalPairAvailable(topRow, left - 1, assigned)) {
            left -= 1;
        }

        let right = col;
        while (right + 1 < cols && isHorizontalPairAvailable(topRow, right + 1, assigned)) {
            right += 1;
        }

        const runLen = right - left + 1;
        const safeMaxLen = Math.max(1, Math.min(maxLen, runLen));
        const safeMinLen = Math.max(1, Math.min(minLen, safeMaxLen));
        const length = randomInt(safeMinLen, safeMaxLen);
        const startMin = Math.max(left, col - length + 1);
        const startMax = Math.min(col, right - length + 1);
        if (startMin > startMax) {
            continue;
        }
        const startCol = randomInt(startMin, startMax);
        const cells = [];
        for (let r = topRow; r <= topRow + 1; r++) {
            for (let c = startCol; c < startCol + length; c++) {
                cells.push({ row: r, col: c });
            }
        }
        candidates.push({
            cells,
            area: cells.length
        });
    }

    if (!candidates.length) {
        return null;
    }

    candidates.sort((a, b) => b.area - a.area);
    const bestArea = candidates[0].area;
    const best = candidates.filter((item) => item.area === bestArea);
    return best[Math.floor(Math.random() * best.length)];
}

function buildVerticalRectCandidate(row, col, assigned, minLen, maxLen) {
    const rows = activeMask.length;
    const candidates = [];

    for (const leftCol of [col - 1, col]) {
        if (leftCol < 0 || !activeMask[row] || leftCol + 1 >= activeMask[row].length) {
            continue;
        }
        if (!isVerticalPairAvailable(row, leftCol, assigned)) {
            continue;
        }

        let top = row;
        while (top - 1 >= 0 && isVerticalPairAvailable(top - 1, leftCol, assigned)) {
            top -= 1;
        }

        let bottom = row;
        while (bottom + 1 < rows && isVerticalPairAvailable(bottom + 1, leftCol, assigned)) {
            bottom += 1;
        }

        const runLen = bottom - top + 1;
        const safeMaxLen = Math.max(1, Math.min(maxLen, runLen));
        const safeMinLen = Math.max(1, Math.min(minLen, safeMaxLen));
        const length = randomInt(safeMinLen, safeMaxLen);
        const startMin = Math.max(top, row - length + 1);
        const startMax = Math.min(row, bottom - length + 1);
        if (startMin > startMax) {
            continue;
        }
        const startRow = randomInt(startMin, startMax);
        const cells = [];
        for (let r = startRow; r < startRow + length; r++) {
            for (let c = leftCol; c <= leftCol + 1; c++) {
                cells.push({ row: r, col: c });
            }
        }
        candidates.push({
            cells,
            area: cells.length
        });
    }

    if (!candidates.length) {
        return null;
    }

    candidates.sort((a, b) => b.area - a.area);
    const bestArea = candidates[0].area;
    const best = candidates.filter((item) => item.area === bestArea);
    return best[Math.floor(Math.random() * best.length)];
}

function buildFallbackMosaicGroup(row, col, assigned) {
    const neighbors = shuffleInPlace([
        { row: row, col: col + 1 },
        { row: row, col: col - 1 },
        { row: row + 1, col: col },
        { row: row - 1, col: col }
    ]);

    for (const next of neighbors) {
        if (isActiveAndUnassignedCell(next.row, next.col, assigned)) {
            return {
                cells: [
                    { row, col },
                    { row: next.row, col: next.col }
                ],
                area: 2
            };
        }
    }

    return {
        cells: [{ row, col }],
        area: 1
    };
}

function buildMosaicRectGroups(minLen, maxLen, horizontalBias) {
    const rows = Math.max(1, Math.floor(config.gridRows));
    const cols = Math.max(1, Math.floor(config.gridCols));
    const assigned = createEmptyMask(rows, cols);
    const groups = [];
    const seeds = [];
    const bias = clamp(Number(horizontalBias), 0, 1);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (activeMask[row] && activeMask[row][col] === 1) {
                seeds.push({ row, col });
            }
        }
    }
    shuffleInPlace(seeds);

    for (const seed of seeds) {
        if (!isActiveAndUnassignedCell(seed.row, seed.col, assigned)) {
            continue;
        }

        const preferHorizontal = Math.random() < bias;
        const first = preferHorizontal
            ? buildHorizontalRectCandidate(seed.row, seed.col, assigned, minLen, maxLen)
            : buildVerticalRectCandidate(seed.row, seed.col, assigned, minLen, maxLen);
        const second = preferHorizontal
            ? buildVerticalRectCandidate(seed.row, seed.col, assigned, minLen, maxLen)
            : buildHorizontalRectCandidate(seed.row, seed.col, assigned, minLen, maxLen);
        const chosen = first || second || buildFallbackMosaicGroup(seed.row, seed.col, assigned);

        if (!chosen || !chosen.cells || !chosen.cells.length) {
            continue;
        }

        for (const cell of chosen.cells) {
            if (!assigned[cell.row] || assigned[cell.row][cell.col] === 1) {
                continue;
            }
            assigned[cell.row][cell.col] = 1;
        }
        groups.push({
            cells: chosen.cells,
            face: 0
        });
    }

    return groups;
}

function inferRectGroupFace(rectGroup) {
    if (!rectGroup || !rectGroup.cells || rectGroup.cells.length === 0) {
        return 0;
    }
    const counts = [0, 0, 0];
    for (const cell of rectGroup.cells) {
        const group = getPixelByGrid(cell.row, cell.col);
        if (!group || group.userData.isRim) {
            continue;
        }
        const face = getGroupPendingFaceIndex(group);
        counts[face] += 1;
    }
    let bestFace = 0;
    let bestCount = counts[0];
    for (let i = 1; i < counts.length; i++) {
        if (counts[i] > bestCount) {
            bestFace = i;
            bestCount = counts[i];
        }
    }
    return bestFace;
}

function queueRectGroupToFace(rectGroup, targetFace, options = {}) {
    if (!rectGroup || !rectGroup.cells || rectGroup.cells.length === 0) {
        return;
    }
    const immediate = options.immediate === true;
    const damping = Number.isFinite(options.damping)
        ? clamp(options.damping, 0.04, 0.25)
        : null;
    const face = normalizeFaceIndex(targetFace);

    for (const cell of rectGroup.cells) {
        const group = getPixelByGrid(cell.row, cell.col);
        if (!group || group.userData.isRim) {
            continue;
        }
        queueGroupToFace(group, face, {
            immediate,
            damping
        });
    }
}

function getMosaicContrastFaces() {
    const faceA = normalizeWaveOnFace(springWaveConfig.mosaicFaceA, 1);
    let faceB = normalizeWaveOnFace(springWaveConfig.mosaicFaceB, 2);
    if (faceA === faceB) {
        faceB = faceA === 1 ? 2 : 1;
    }
    return { faceA, faceB };
}

function isGlobalSpringMusicSyncActive() {
    return springWaveConfig.musicSyncAllEffects === true && isMusicSnapshotReady();
}

function getGlobalSpringSyncProfile(baseMs, baseDamping, options = {}) {
    const base = Math.max(0, Number(baseMs) || 0);
    const baseDamp = clamp(Number(baseDamping), 0.04, 0.25);
    const defaultMin = clamp(Math.floor(Number(springWaveConfig.musicSyncMinMs)), 20, 1200);
    const defaultMax = clamp(
        Math.max(defaultMin + 1, Math.floor(Number(springWaveConfig.musicSyncMaxMs))),
        defaultMin + 1,
        1600
    );
    const minMs = clamp(
        Number.isFinite(options.minMs) ? Math.floor(options.minMs) : defaultMin,
        0,
        5000
    );
    const maxMs = clamp(
        Number.isFinite(options.maxMs) ? Math.floor(options.maxMs) : defaultMax,
        Math.max(minMs + 1, 1),
        12000
    );
    const syncMode = String(springWaveConfig.musicSyncMode || '关闭');

    if (!isGlobalSpringMusicSyncActive() || syncMode === '关闭') {
        const safeBaseMs = clamp(Math.round(base), minMs, maxMs);
        return {
            ms: safeBaseMs,
            damping: baseDamp,
            beatPulse: 0,
            tempoFactor: base > 0 ? (base / Math.max(1, safeBaseMs)) : 1
        };
    }

    const strength = clamp(Number(springWaveConfig.musicSyncStrength), 0, 1);
    const beatPulseStrength = clamp(Number(springWaveConfig.musicSyncBeatPulse), 0, 1);
    const energy = clamp(Number(musicDriveState.smoothedEnergy), 0, 1);
    const flux = clamp(Math.max(0, Number(musicDriveState.energyFlux) * 8), 0, 1);

    let syncedMs = base > 0 ? base : maxMs;
    let beatPulse = 0;
    if (syncMode === '跟随音频能量') {
        const drive = clamp(energy * 0.66 + flux * 0.34, 0, 1);
        syncedMs = Math.round(maxMs - (maxMs - minMs) * drive);
    } else {
        const beatIntervalRaw = musicDriveState.smoothedBeatIntervalMs > 0
            ? musicDriveState.smoothedBeatIntervalMs
            : musicDriveState.beatIntervalMs;
        const beatInterval = clamp(Number(beatIntervalRaw), 0, 1800);
        const beatAge = performance.now() - Number(musicDriveState.lastBeatAt || 0);
        const subdivisionsBase = clamp(Number(options.subdivisionsBase ?? 2.0), 1.1, 4);
        const subdivisionsEnergy = clamp(Number(options.subdivisionsEnergy ?? 0.6), 0, 2);
        const subdivisionsMin = clamp(Number(options.subdivisionsMin ?? 1.2), 1, subdivisionsBase);

        if (beatInterval >= 220) {
            const tempoBase = clamp(beatInterval, 240, 1500);
            const subdivisions = clamp(subdivisionsBase - energy * subdivisionsEnergy, subdivisionsMin, subdivisionsBase);
            const pulseWindow = clamp(tempoBase * 0.44, 80, 520);
            beatPulse = clamp(1 - beatAge / pulseWindow, 0, 1);
            const tempoMs = tempoBase / subdivisions;
            const pulseAdjusted = tempoMs * (1 - beatPulse * beatPulseStrength * 0.42);
            const fluxAdjusted = pulseAdjusted * (1 - flux * 0.16);
            syncedMs = Math.round(clamp(fluxAdjusted, minMs, maxMs));
        } else {
            const drive = clamp(energy * 0.44 + flux * 0.22, 0, 1);
            syncedMs = Math.round(maxMs - (maxMs - minMs) * drive * 0.76);
            beatPulse = clamp(flux * 0.4, 0, 1);
        }
    }

    const safeBase = base > 0 ? base : syncedMs;
    const mixedMs = clamp(
        Math.round(safeBase * (1 - strength) + syncedMs * strength),
        minMs,
        maxMs
    );
    const tempoFactor = clamp(safeBase / Math.max(1, mixedMs), 0.4, 3.4);
    const damping = clamp(baseDamp * (1 + (tempoFactor - 1) * 0.58), 0.04, 0.25);

    return {
        ms: mixedMs,
        damping,
        beatPulse,
        tempoFactor
    };
}

function getSweepMusicSyncProfile(baseDurationMs) {
    const baseDuration = clamp(Math.floor(Number(baseDurationMs)), 220, 9000);
    const baseDamping = clamp(Number(springWaveConfig.damping), 0.04, 0.25);
    const syncMode = String(springWaveConfig.musicSyncMode || '关闭');
    if (!isGlobalSpringMusicSyncActive() || syncMode === '关闭') {
        return {
            durationMs: baseDuration,
            damping: baseDamping,
            beatPulse: 0,
            intensityBoost: 1
        };
    }

    const strength = clamp(Number(springWaveConfig.musicSyncStrength), 0, 1);
    const beatPulseStrength = clamp(Number(springWaveConfig.musicSyncBeatPulse), 0, 1);
    const energy = clamp(Number(musicDriveState.smoothedEnergy), 0, 1);
    const flux = clamp(Math.max(0, Number(musicDriveState.energyFlux) * 8), 0, 1);
    const beatIntervalRaw = musicDriveState.smoothedBeatIntervalMs > 0
        ? musicDriveState.smoothedBeatIntervalMs
        : musicDriveState.beatIntervalMs;
    const beatInterval = clamp(Number(beatIntervalRaw), 0, 2000);
    const beatAge = performance.now() - Number(musicDriveState.lastBeatAt || 0);

    const energyDuration = clamp(
        baseDuration * (1.28 - (energy * 0.72 + flux * 0.26)),
        220,
        9000
    );
    let syncedDuration = energyDuration;
    let beatPulse = clamp(flux * 0.42, 0, 1);

    if (syncMode === '节拍优先' && beatInterval >= 220) {
        const beatConfidence = clamp(1 - beatAge / Math.max(beatInterval * 1.6, 180), 0, 1);
        const beatRatio = clamp(1.2 - energy * 0.22, 0.9, 1.4);
        const beatDuration = clamp(beatInterval * beatRatio, 220, 9000);
        syncedDuration = beatDuration * beatConfidence + energyDuration * (1 - beatConfidence);
        const pulseWindow = clamp(beatInterval * 0.5, 90, 560);
        beatPulse = clamp(1 - beatAge / pulseWindow, 0, 1);
    }

    const mixedDuration = clamp(
        Math.round(baseDuration * (1 - strength) + syncedDuration * strength),
        220,
        9000
    );
    const tempoFactor = clamp(baseDuration / Math.max(1, mixedDuration), 0.4, 3.2);
    const damping = clamp(baseDamping * (1 + (tempoFactor - 1) * 0.5), 0.04, 0.25);
    const intensityBoost = 1 + beatPulse * beatPulseStrength * 0.5;

    return {
        durationMs: mixedDuration,
        damping,
        beatPulse,
        intensityBoost
    };
}

function getMosaicBlinkUpdateMs(baseUpdateMs) {
    const base = clamp(Math.floor(Number(baseUpdateMs)), 40, 600);
    const syncMode = String(springWaveConfig.mosaicTempoSync || '关闭');
    if (syncMode === '关闭') {
        const globalProfile = getGlobalSpringSyncProfile(base, springWaveConfig.damping, {
            minMs: 30,
            maxMs: 700,
            subdivisionsBase: 2.0,
            subdivisionsEnergy: 0.6,
            subdivisionsMin: 1.2
        });
        return clamp(Math.round(globalProfile.ms), 30, 700);
    }
    if (!isMusicSnapshotReady()) {
        return base;
    }

    const strength = clamp(Number(springWaveConfig.mosaicSyncStrength), 0, 1);
    const syncMinRaw = Math.floor(Number(springWaveConfig.mosaicSyncMinMs));
    const syncMaxRaw = Math.floor(Number(springWaveConfig.mosaicSyncMaxMs));
    const syncMin = clamp(syncMinRaw, 30, 700);
    const syncMax = clamp(Math.max(syncMin + 1, syncMaxRaw), syncMin + 1, 700);
    const energy = clamp(Number(musicDriveState.smoothedEnergy), 0, 1);
    const flux = clamp(Math.max(0, Number(musicDriveState.energyFlux) * 8), 0, 1);

    let syncedMs = base;
    if (syncMode === '跟随音频能量') {
        const drive = clamp(energy * 0.68 + flux * 0.32, 0, 1);
        syncedMs = Math.round(syncMax - (syncMax - syncMin) * drive);
    } else {
        const beatIntervalRaw = musicDriveState.smoothedBeatIntervalMs > 0
            ? musicDriveState.smoothedBeatIntervalMs
            : musicDriveState.beatIntervalMs;
        const beatInterval = clamp(Number(beatIntervalRaw), 0, 1800);
        const beatAge = performance.now() - Number(musicDriveState.lastBeatAt || 0);

        if (beatInterval >= 220) {
            const tempoBase = clamp(beatInterval, 260, 1400);
            const subdivisions = clamp(2.05 - energy * 0.55, 1.4, 2.05);
            const pulseWindow = clamp(tempoBase * 0.42, 110, 420);
            const beatPulse = clamp(1 - beatAge / pulseWindow, 0, 1);
            const tempoMs = tempoBase / subdivisions;
            const pulseAdjusted = tempoMs * (1 - beatPulse * 0.22);
            const energyAdjusted = pulseAdjusted * (1 - flux * 0.12);
            syncedMs = Math.round(clamp(energyAdjusted, syncMin, syncMax));
        } else {
            // 尚未稳定识别节拍时，先弱跟随能量，避免一上来就高速闪烁
            const drive = clamp(energy * 0.42 + flux * 0.2, 0, 1);
            syncedMs = Math.round(syncMax - (syncMax - syncMin) * drive * 0.72);
        }
    }

    const mixedMs = Math.round(base * (1 - strength) + syncedMs * strength);
    return clamp(mixedMs, 30, 700);
}

async function playRectMosaicBlinkEffect(runId) {
    const minLen = clamp(Math.floor(Number(springWaveConfig.mosaicMinLen)), 1, 24);
    const maxLen = clamp(Math.floor(Number(springWaveConfig.mosaicMaxLen)), minLen, 40);
    const horizontalBias = clamp(Number(springWaveConfig.mosaicHorizontalBias), 0, 1);
    const activationRate = clamp(Number(springWaveConfig.mosaicActivationRate), 0, 0.98);
    const decayRate = clamp(Number(springWaveConfig.mosaicDecayRate), 0, 0.98);
    const swapRate = clamp(Number(springWaveConfig.mosaicSwapRate), 0, 0.98);
    const contrastBias = clamp(Number(springWaveConfig.mosaicContrastBias), 0, 1);
    const updateMs = clamp(Math.floor(Number(springWaveConfig.mosaicUpdateMs)), 40, 600);
    const rebuildMs = clamp(Math.floor(Number(springWaveConfig.mosaicRebuildMs)), 600, 12000);
    const damping = clamp(Number(springWaveConfig.damping), 0.04, 0.25);
    const resetOnStart = springWaveConfig.mosaicResetOnStart === true;
    const faces = getMosaicContrastFaces();

    let groups = buildMosaicRectGroups(minLen, maxLen, horizontalBias);
    if (!groups.length) {
        return;
    }

    if (resetOnStart) {
        for (const rectGroup of groups) {
            queueRectGroupToFace(rectGroup, 0, { immediate: true });
            rectGroup.face = 0;
        }
    } else {
        for (const rectGroup of groups) {
            rectGroup.face = inferRectGroupFace(rectGroup);
        }
    }

    let lastRebuildAt = performance.now();

    while (springWaveState.running && runId === springWaveState.runId) {
        const now = performance.now();
        if (now - lastRebuildAt >= rebuildMs) {
            groups = buildMosaicRectGroups(minLen, maxLen, horizontalBias);
            if (!groups.length) {
                return;
            }
            for (const rectGroup of groups) {
                rectGroup.face = inferRectGroupFace(rectGroup);
            }
            lastRebuildAt = now;
        }

        for (const rectGroup of groups) {
            let nextFace = rectGroup.face;
            if (nextFace === 0) {
                if (Math.random() < activationRate) {
                    nextFace = Math.random() < contrastBias ? faces.faceA : faces.faceB;
                }
            } else if (Math.random() < decayRate) {
                nextFace = 0;
            } else if (Math.random() < swapRate) {
                nextFace = (nextFace === faces.faceA) ? faces.faceB : faces.faceA;
            }

            if (nextFace !== rectGroup.face) {
                rectGroup.face = nextFace;
                queueRectGroupToFace(rectGroup, nextFace, { damping });
            }
        }

        await waitMs(getMosaicBlinkUpdateMs(updateMs));
    }
}

function normalizeWaveOnFace(face, fallback = 1) {
    const value = Number.isFinite(face) ? Math.floor(face) : fallback;
    return clamp(value, 1, 2);
}

function isDualTrackInstantColorMode() {
    if (experienceState.autoOrchestration) {
        return false;
    }
    return springWaveConfig.flowRenderMode === DUAL_TRACK_FLOW_MODE_COLOR_ONLY;
}

function compareCellsByPosition(a, b) {
    if (a.row !== b.row) {
        return a.row - b.row;
    }
    return a.col - b.col;
}

function collectTrackLayerCells() {
    const rows = Math.max(1, Math.floor(config.gridRows));
    const cols = Math.max(1, Math.floor(config.gridCols));
    const dist = Array.from({ length: rows }, () => Array(cols).fill(-1));
    const queue = [];
    let qIndex = 0;
    const neighbors4 = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];
    const neighbors8 = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1]
    ];
    const isActiveCell = (row, col) => (
        row >= 0
        && row < rows
        && col >= 0
        && col < cols
        && activeMask[row]
        && activeMask[row][col] === 1
    );

    const outerTrack = [];
    const innerTrack = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!isActiveCell(row, col)) {
                continue;
            }
            let isOuter = false;
            for (const [dr, dc] of neighbors8) {
                const rr = row + dr;
                const cc = col + dc;
                if (!isActiveCell(rr, cc)) {
                    isOuter = true;
                    break;
                }
            }
            if (isOuter) {
                outerTrack.push({ row, col });
                dist[row][col] = 0;
                queue.push([row, col]);
            } else {
                innerTrack.push({ row, col });
            }
        }
    }

    if (innerTrack.length > 0) {
        return { outerTrack, innerTrack };
    }

    // Fallback: 若形状过窄导致去圈后为空，则退化为“边界=外轨，次层=内轨”。
    while (qIndex < queue.length) {
        const [row, col] = queue[qIndex++];
        const nextDist = dist[row][col] + 1;
        for (const [dr, dc] of neighbors4) {
            const rr = row + dr;
            const cc = col + dc;
            if (!isActiveCell(rr, cc)) {
                continue;
            }
            if (dist[rr][cc] !== -1) {
                continue;
            }
            dist[rr][cc] = nextDist;
            queue.push([rr, cc]);
        }
    }

    outerTrack.length = 0;
    innerTrack.length = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const d = dist[row][col];
            if (d < 0) {
                continue;
            }
            if (d === 0) {
                outerTrack.push({ row, col });
            } else if (d === 1) {
                innerTrack.push({ row, col });
            }
        }
    }

    if (!innerTrack.length) {
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (dist[row][col] > 0) {
                    innerTrack.push({ row, col });
                }
            }
        }
    }

    if (!innerTrack.length && outerTrack.length) {
        innerTrack.push(...outerTrack);
    }

    return { outerTrack, innerTrack };
}

function buildTrackFlowPhases(cells) {
    const byKey = new Map();
    const neighbors = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];
    for (const cell of cells) {
        byKey.set(gridKey(cell.row, cell.col), {
            row: cell.row,
            col: cell.col,
            neighbors: []
        });
    }
    for (const [key, node] of byKey.entries()) {
        for (const [dr, dc] of neighbors) {
            const nextKey = gridKey(node.row + dr, node.col + dc);
            if (byKey.has(nextKey)) {
                node.neighbors.push(nextKey);
            }
        }
    }

    const sortKeysByPosition = (keys) => (
        keys.slice().sort((a, b) => compareCellsByPosition(byKey.get(a), byKey.get(b)))
    );

    const visited = new Set();
    const components = [];
    for (const key of byKey.keys()) {
        if (visited.has(key)) {
            continue;
        }
        const stack = [key];
        visited.add(key);
        const keys = [];
        while (stack.length) {
            const curr = stack.pop();
            keys.push(curr);
            for (const nb of byKey.get(curr).neighbors) {
                if (visited.has(nb)) {
                    continue;
                }
                visited.add(nb);
                stack.push(nb);
            }
        }
        components.push(keys);
    }

    const componentAnchor = (keys) => {
        const ordered = sortKeysByPosition(keys);
        return byKey.get(ordered[0]);
    };
    components.sort((a, b) => compareCellsByPosition(componentAnchor(a), componentAnchor(b)));

    const buildLinearOrder = (componentKeys) => {
        const componentSet = new Set(componentKeys);
        let maxDegree = 0;
        for (const key of componentKeys) {
            maxDegree = Math.max(maxDegree, byKey.get(key).neighbors.length);
        }
        if (maxDegree > 2) {
            return null;
        }

        const endpoints = componentKeys.filter((key) => byKey.get(key).neighbors.length === 1);
        const startKey = sortKeysByPosition(endpoints)[0] || sortKeysByPosition(componentKeys)[0];
        const seen = new Set();
        const order = [];
        let prev = null;
        let curr = startKey;
        while (curr && !seen.has(curr)) {
            seen.add(curr);
            order.push(curr);
            const nextCandidates = byKey.get(curr).neighbors
                .filter((key) => componentSet.has(key) && key !== prev);
            if (!nextCandidates.length) {
                break;
            }
            if (nextCandidates.length === 1) {
                prev = curr;
                curr = nextCandidates[0];
                continue;
            }
            const unvisited = nextCandidates.filter((key) => !seen.has(key));
            const pool = unvisited.length ? unvisited : nextCandidates;
            prev = curr;
            curr = sortKeysByPosition(pool)[0];
        }
        return order.length === componentKeys.length ? order : null;
    };

    const phaseByKey = new Map();
    let phaseOffset = 0;
    for (const componentKeys of components) {
        const linearOrder = buildLinearOrder(componentKeys);
        if (linearOrder) {
            for (let i = 0; i < linearOrder.length; i++) {
                phaseByKey.set(linearOrder[i], phaseOffset + i);
            }
            phaseOffset += linearOrder.length;
            continue;
        }

        const orderedKeys = sortKeysByPosition(componentKeys);
        const endpoints = componentKeys.filter((key) => byKey.get(key).neighbors.length <= 1);
        const startKey = sortKeysByPosition(endpoints)[0] || orderedKeys[0];
        const componentSet = new Set(componentKeys);
        const dist = new Map();
        const queue = [startKey];
        dist.set(startKey, 0);
        let qCursor = 0;
        while (qCursor < queue.length) {
            const curr = queue[qCursor++];
            const currDist = dist.get(curr);
            for (const nb of byKey.get(curr).neighbors) {
                if (!componentSet.has(nb) || dist.has(nb)) {
                    continue;
                }
                dist.set(nb, currDist + 1);
                queue.push(nb);
            }
        }
        let localMax = 0;
        for (const key of orderedKeys) {
            localMax = Math.max(localMax, dist.get(key) || 0);
        }
        for (const key of orderedKeys) {
            const d = dist.has(key) ? dist.get(key) : localMax + 1;
            phaseByKey.set(key, phaseOffset + d);
        }
        phaseOffset += localMax + 1;
    }

    return {
        phaseByKey,
        phaseCount: Math.max(1, phaseOffset)
    };
}

function queueQuadTrackCellToFace(row, col, targetFace, colorValue, dampingOverride = null) {
    const group = getPixelByGrid(row, col);
    if (!group || group.userData.isRim) {
        return false;
    }
    applyGroupTrackColor(group, colorValue);
    if (isDualTrackInstantColorMode()) {
        return true;
    }
    return queueGroupToFace(group, targetFace, {
        immediate: false,
        damping: Number.isFinite(dampingOverride)
            ? clamp(dampingOverride, 0.04, 0.25)
            : springWaveConfig.damping
    });
}

async function playDualTrackFlowEffect(runId) {
    const { outerTrack, innerTrack } = collectTrackLayerCells();
    const outerFace = normalizeWaveOnFace(springWaveConfig.outerFace, 1);
    const innerBaseFace = normalizeWaveOnFace(springWaveConfig.innerBaseFace, 2);
    const innerFlowFace = normalizeFaceIndex(springWaveConfig.innerFlowFace);
    const outerColor = resolveTrackColor(springWaveConfig.outerTrackColor, '#d84d2e');
    const innerBaseColor = resolveTrackColor(springWaveConfig.innerBaseColor, '#3b0f1c');
    const innerFlowColor = resolveTrackColor(springWaveConfig.innerFlowColor, '#ffb347');
    const baseStepDelay = clamp(Math.floor(springWaveConfig.flowStepMs), 20, 420);
    const initialSync = getGlobalSpringSyncProfile(baseStepDelay, springWaveConfig.damping, {
        minMs: 20,
        maxMs: 420,
        subdivisionsBase: 2.1,
        subdivisionsEnergy: 0.7,
        subdivisionsMin: 1.2
    });

    if (isDualTrackInstantColorMode()) {
        freezePixelsForInstantColorFlow();
    }

    for (const cell of outerTrack) {
        if (!springWaveState.running || runId !== springWaveState.runId) {
            return;
        }
        queueQuadTrackCellToFace(cell.row, cell.col, outerFace, outerColor, initialSync.damping);
    }

    for (const cell of innerTrack) {
        if (!springWaveState.running || runId !== springWaveState.runId) {
            return;
        }
        queueQuadTrackCellToFace(cell.row, cell.col, innerBaseFace, innerBaseColor, initialSync.damping);
    }

    if (!innerTrack.length) {
        return;
    }

    const flowProfile = buildTrackFlowPhases(innerTrack);
    const phaseByKey = flowProfile.phaseByKey;
    const phaseCount = flowProfile.phaseCount;
    const cycles = clamp(Math.floor(springWaveConfig.flowCycles), 1, 12);
    const bandSize = clamp(Math.floor(springWaveConfig.flowBandSize), 1, 4);
    const reverse = springWaveConfig.flowDirection === '反向';
    const totalSteps = phaseCount * cycles;

    for (let step = 0; step < totalSteps; step++) {
        if (!springWaveState.running || runId !== springWaveState.runId) {
            return;
        }
        const flowSync = getGlobalSpringSyncProfile(baseStepDelay, springWaveConfig.damping, {
            minMs: 20,
            maxMs: 420,
            subdivisionsBase: 2.1,
            subdivisionsEnergy: 0.7,
            subdivisionsMin: 1.2
        });
        const dynamicBandSize = clamp(
            Math.round(bandSize + flowSync.beatPulse * springWaveConfig.musicSyncBeatPulse * 2),
            1,
            6
        );
        const head = reverse
            ? ((phaseCount - 1) - (step % phaseCount))
            : (step % phaseCount);
        for (const cell of innerTrack) {
            const phase = phaseByKey.get(gridKey(cell.row, cell.col));
            if (!Number.isFinite(phase)) {
                continue;
            }
            const distance = (phase - head + phaseCount) % phaseCount;
            const targetFace = distance < dynamicBandSize ? innerFlowFace : innerBaseFace;
            const targetColor = distance < dynamicBandSize ? innerFlowColor : innerBaseColor;
            queueQuadTrackCellToFace(cell.row, cell.col, targetFace, targetColor, flowSync.damping);
        }
        if (flowSync.ms > 0 && step < totalSteps - 1) {
            await waitMs(flowSync.ms);
        }
    }
}

async function triggerRowFlipInnerWave(row, steps, runId, delayOverride = null, dampingOverride = null) {
    const cols = getRowActiveColumns(row);
    const delay = Number.isFinite(delayOverride)
        ? Math.max(0, Math.floor(delayOverride))
        : Math.max(0, Math.floor(springWaveConfig.innerDelayMs));
    const damping = Number.isFinite(dampingOverride)
        ? clamp(dampingOverride, 0.04, 0.25)
        : springWaveConfig.damping;
    for (let i = 0; i < cols.length; i++) {
        if (!springWaveState.running || runId !== springWaveState.runId) {
            return;
        }
        triggerSinglePixelFlip(row, cols[i], steps, damping);
        if (delay > 0 && i < cols.length - 1) {
            await waitMs(delay);
        }
    }
}

async function playSpringWaveRow(row, runId) {
    if (!springWaveState.running || runId !== springWaveState.runId) {
        return;
    }
    const stage1Sync = getGlobalSpringSyncProfile(springWaveConfig.stagePauseMs, springWaveConfig.damping, {
        minMs: 0,
        maxMs: 800,
        subdivisionsBase: 2.2,
        subdivisionsEnergy: 0.8,
        subdivisionsMin: 1.15
    });
    const innerStage1Sync = getGlobalSpringSyncProfile(springWaveConfig.innerDelayMs, stage1Sync.damping, {
        minMs: 0,
        maxMs: 120,
        subdivisionsBase: 2.8,
        subdivisionsEnergy: 1.0,
        subdivisionsMin: 1.1
    });
    if (springWaveConfig.effect === '效果2-行内波') {
        await triggerRowFlipInnerWave(row, 2, runId, innerStage1Sync.ms, innerStage1Sync.damping); // 先翻两个面
    } else {
        triggerRowFlip(row, 2, stage1Sync.damping); // 效果1：整行同步翻
    }
    await waitMs(Math.max(0, Math.floor(stage1Sync.ms)));
    if (!springWaveState.running || runId !== springWaveState.runId) {
        return;
    }
    const stage2Sync = getGlobalSpringSyncProfile(springWaveConfig.stagePauseMs, stage1Sync.damping, {
        minMs: 0,
        maxMs: 800,
        subdivisionsBase: 2.1,
        subdivisionsEnergy: 0.75,
        subdivisionsMin: 1.1
    });
    const innerStage2Sync = getGlobalSpringSyncProfile(springWaveConfig.innerDelayMs, stage2Sync.damping, {
        minMs: 0,
        maxMs: 120,
        subdivisionsBase: 2.7,
        subdivisionsEnergy: 0.9,
        subdivisionsMin: 1.1
    });
    if (springWaveConfig.effect === '效果2-行内波') {
        await triggerRowFlipInnerWave(row, 1, runId, innerStage2Sync.ms, innerStage2Sync.damping); // 再翻一个面
    } else {
        triggerRowFlip(row, 1, stage2Sync.damping); // 效果1：整行同步翻
    }
}

async function playSweepLightEffect(runId) {
    if (!sweepLights.length) {
        return;
    }
    updateSweepLightParams();

    const bounds = activeWallBounds || {
        minX: -8,
        maxX: 8,
        minY: -6,
        maxY: 6,
        centerX: 0,
        centerY: 0,
        width: 16,
        height: 12
    };

    const baseDuration = Math.max(100, Math.floor(sweepLightConfig.durationMs));
    const overscanRatio = clamp(sweepLightConfig.overscan, 0, 0.8);
    const overscanDistance = Math.max(UNIT_SIZE, bounds.height * overscanRatio);
    const topY = bounds.maxY + overscanDistance;
    const bottomY = bounds.minY - overscanDistance;
    const fromY = springWaveConfig.direction === '从下到上' ? bottomY : topY;
    const toY = springWaveConfig.direction === '从下到上' ? topY : bottomY;
    const count = sweepLights.length;
    const centerX = bounds.centerX + sweepLightConfig.xOffset;
    const span = Math.max(UNIT_SIZE, bounds.width * clamp(sweepLightConfig.spanScale, 0.6, 2.2));
    const leftX = centerX - span * 0.5;
    const stepX = count > 1 ? (span / (count - 1)) : 0;
    const edgeAttenuation = clamp(sweepLightConfig.edgeAttenuation, 0, 0.8);
    const centerIndex = (count - 1) * 0.5;
    const maxDistance = Math.max(1, centerIndex);

    const sweepCount = (musicDriveState.smoothedEnergy >= 0.58 || musicDriveState.lowBand >= 0.5 || Math.random() > 0.6) ? 3 : 2;
    for (const item of sweepLights) {
        item.light.visible = true;
    }
    for (let pass = 0; pass < sweepCount; pass++) {
        if (!springWaveState.running || runId !== springWaveState.runId) {
            break;
        }
        const passFromY = pass % 2 === 0 ? fromY : toY;
        const passToY = pass % 2 === 0 ? toY : fromY;
        let progress = 0;
        let prevAt = performance.now();
        while (springWaveState.running && runId === springWaveState.runId) {
            const now = performance.now();
            const dt = Math.max(0, now - prevAt);
            prevAt = now;
            const sweepSync = getSweepMusicSyncProfile(baseDuration);
            progress = clamp(progress + dt / Math.max(100, sweepSync.durationMs), 0, 1);
            const t = progress;
            const eased = t * t * (3 - 2 * t); // smoothstep
            const y = passFromY + (passToY - passFromY) * eased;
            const envelope = 0.25 + 0.75 * Math.sin(Math.PI * t);

            for (let i = 0; i < sweepLights.length; i++) {
                const item = sweepLights[i];
                const x = (count === 1) ? centerX : (leftX + stepX * i);
                const distanceNorm = (count === 1) ? 0 : Math.abs(i - centerIndex) / maxDistance;
                const weight = 1 - edgeAttenuation * distanceNorm;
                item.light.position.set(x, y, sweepLightConfig.z);
                item.target.position.set(x, y, -4);
                item.light.intensity = sweepLightConfig.intensity * envelope * weight * sweepSync.intensityBoost;
            }

            if (progress >= 1) {
                break;
            }
            await waitMs(16);
        }
        if (pass < sweepCount - 1) {
            await waitMs(90);
        }
    }

    for (const item of sweepLights) {
        item.light.visible = false;
        item.light.intensity = 0;
    }
}

async function startSpringWave() {
    if (!isSpringFestivalMode() || pixels.length === 0) {
        return;
    }

    stopPlayback();
    // 每轮开始前强制回到初始面，避免上一轮未收尾导致的残留姿态。
    stopSpringWave({ resetPose: true });
    springWaveState.running = true;
    const runId = springWaveState.runId;
    const rowOrder = getSpringActiveRows();
    const rowTasks = [];
    if (springWaveConfig.effect !== '效果4-双轨流色') {
        clearAllTrackColorOverrides();
    }

    if (springWaveConfig.effect === '效果3-扫光') {
        await playSweepLightEffect(runId);
        if (runId === springWaveState.runId) {
            springWaveState.running = false;
        }
        return;
    }
    if (springWaveConfig.effect === '效果4-双轨流色') {
        await playDualTrackFlowEffect(runId);
        if (runId === springWaveState.runId) {
            springWaveState.running = false;
        }
        return;
    }
    if (springWaveConfig.effect === '效果5-柱形均衡波') {
        await playColumnEqualizerEffect(runId);
        if (runId === springWaveState.runId) {
            springWaveState.running = false;
        }
        return;
    }
    if (springWaveConfig.effect === '效果6-矩形闪烁块') {
        await playRectMosaicBlinkEffect(runId);
        if (runId === springWaveState.runId) {
            springWaveState.running = false;
        }
        return;
    }

    for (let i = 0; i < rowOrder.length; i++) {
        if (!springWaveState.running || runId !== springWaveState.runId) {
            break;
        }
        rowTasks.push(playSpringWaveRow(rowOrder[i], runId));
        const rowSync = getGlobalSpringSyncProfile(springWaveConfig.rowIntervalMs, springWaveConfig.damping, {
            minMs: 0,
            maxMs: 800,
            subdivisionsBase: 2.4,
            subdivisionsEnergy: 0.9,
            subdivisionsMin: 1.1
        });
        if (rowSync.ms > 0) {
            await waitMs(rowSync.ms);
        }
    }

    await Promise.all(rowTasks);
    if (runId === springWaveState.runId) {
        springWaveState.running = false;
    }
}

function getPixelByGrid(row, col) {
    const rows = Math.max(1, Math.floor(config.gridRows));
    const cols = Math.max(1, Math.floor(config.gridCols));
    const safeRow = Math.floor(row);
    const safeCol = Math.floor(col);
    if (safeRow < 0 || safeRow >= rows || safeCol < 0 || safeCol >= cols) {
        return null;
    }
    return pixelLookup.get(gridKey(safeRow, safeCol)) || null;
}

function setPixelDisplayState(row, col, on, immediate = false) {
    const group = getPixelByGrid(row, col);
    if (!group || group.userData.isRim) return false;
    const targetFace = on ? Math.max(1, Math.min(2, Math.floor(displayConfig.onFace))) : 0;
    return queueGroupToFace(group, targetFace, { immediate });
}

function applyTextGrid(grid, immediate = false) {
    const rows = Math.max(1, Math.floor(config.gridRows));
    const cols = Math.max(1, Math.floor(config.gridCols));
    const onFace = Math.max(1, Math.min(2, Math.floor(displayConfig.onFace)));
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const group = getPixelByGrid(row, col);
            if (!group || group.userData.isRim) {
                continue;
            }
            const desiredOn = grid[row][col] === 1;
            const desiredFace = desiredOn ? onFace : 0;
            if (!immediate) {
                const pendingFace = getGroupPendingFaceIndex(group);
                if (pendingFace === desiredFace) {
                    continue;
                }
            }
            queueGroupToFace(group, desiredFace, { immediate });
        }
    }
}

function findAlphaBounds(alphaMap, width, height, threshold = 12) {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (alphaMap[y * width + x] < threshold) {
                continue;
            }
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
    if (maxX < minX || maxY < minY) {
        return null;
    }
    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
    };
}

function resampleAlphaToGrid(alphaMap, sourceWidth, sourceHeight, targetCols, targetRows, options = {}) {
    const grid = Array.from({ length: targetRows }, () => Array(targetCols).fill(0));
    if (!alphaMap || sourceWidth <= 0 || sourceHeight <= 0 || targetCols <= 0 || targetRows <= 0) {
        return grid;
    }

    const coverageThreshold = clamp(Number(options.coverageThreshold ?? 0.12), 0.01, 0.9);
    const scoreThreshold = clamp(Number(options.scoreThreshold ?? 0.12), 0.01, 0.95);
    const peakThreshold = clamp(Number(options.peakThreshold ?? 0.45), 0.01, 1);
    const coverageCutoff = clamp(Number(options.coverageCutoff ?? 0.2), 0.01, 1);

    const scaleFactor = Math.max(sourceWidth / targetCols, sourceHeight / targetRows, 1);
    const scaledW = Math.min(targetCols, Math.max(1, Math.floor(sourceWidth / scaleFactor)));
    const scaledH = Math.min(targetRows, Math.max(1, Math.floor(sourceHeight / scaleFactor)));
    const startCol = Math.floor((targetCols - scaledW) / 2);
    const startRow = Math.floor((targetRows - scaledH) / 2);

    for (let ty = 0; ty < scaledH; ty++) {
        const y0 = Math.floor(ty * sourceHeight / scaledH);
        const y1 = Math.min(sourceHeight, Math.floor((ty + 1) * sourceHeight / scaledH));
        for (let tx = 0; tx < scaledW; tx++) {
            const x0 = Math.floor(tx * sourceWidth / scaledW);
            const x1 = Math.min(sourceWidth, Math.floor((tx + 1) * sourceWidth / scaledW));

            let sum = 0;
            let peak = 0;
            let coverageCount = 0;
            let count = 0;

            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    const alpha = alphaMap[y * sourceWidth + x] / 255;
                    sum += alpha;
                    if (alpha > peak) {
                        peak = alpha;
                    }
                    if (alpha >= coverageCutoff) {
                        coverageCount += 1;
                    }
                    count += 1;
                }
            }

            if (count === 0) {
                continue;
            }

            const avg = sum / count;
            const coverage = coverageCount / count;
            const score = avg * 0.72 + peak * 0.28;
            if (score >= scoreThreshold || coverage >= coverageThreshold || peak >= peakThreshold) {
                grid[startRow + ty][startCol + tx] = 1;
            }
        }
    }

    return grid;
}

function bridgeBinaryGridGaps(sourceGrid, neighborThreshold = 3) {
    const rows = sourceGrid.length;
    const cols = rows > 0 ? sourceGrid[0].length : 0;
    if (rows < 3 || cols < 3) {
        return sourceGrid;
    }
    const grid = sourceGrid.map((row) => row.slice());
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (sourceGrid[r][c]) {
                continue;
            }
            const n = sourceGrid[r - 1][c] + sourceGrid[r + 1][c] + sourceGrid[r][c - 1] + sourceGrid[r][c + 1];
            const connected =
                (sourceGrid[r - 1][c] && sourceGrid[r + 1][c]) ||
                (sourceGrid[r][c - 1] && sourceGrid[r][c + 1]);
            if (connected && n >= neighborThreshold) {
                grid[r][c] = 1;
            }
        }
    }
    return grid;
}

function countOnPixels(grid) {
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c]) count += 1;
        }
    }
    return count;
}

function dilateBinaryGrid(sourceGrid, passes = 1) {
    let grid = sourceGrid.map((row) => row.slice());
    const rows = grid.length;
    const cols = rows > 0 ? grid[0].length : 0;
    if (rows === 0 || cols === 0 || passes <= 0) {
        return grid;
    }
    for (let pass = 0; pass < passes; pass++) {
        const next = grid.map((row) => row.slice());
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c]) {
                    continue;
                }
                let hasNeighbor = false;
                for (let dr = -1; dr <= 1 && !hasNeighbor; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const rr = r + dr;
                        const cc = c + dc;
                        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) {
                            continue;
                        }
                        if (grid[rr][cc]) {
                            hasNeighbor = true;
                            break;
                        }
                    }
                }
                if (hasNeighbor) {
                    next[r][c] = 1;
                }
            }
        }
        grid = next;
    }
    return grid;
}


async function ensureFontLoaded(fontFamily) {
    if (!document.fonts) return;
    try {
        await document.fonts.load(`12px ${fontFamily}`);
    } catch (e) {
        console.warn('Font load failed', e);
    }
}

function rasterizeGlyphToBinaryGrid(ch, targetWidth, targetHeight, options = {}) {
    const char = String(ch || ' ');
    const safeWidth = Math.max(1, Math.floor(targetWidth));
    const safeHeight = Math.max(1, Math.floor(targetHeight));
    if (!char.trim()) {
        return Array.from({ length: safeHeight }, () => Array(safeWidth).fill(0));
    }

    const isCjkGlyph = options.isCjk === true;
    const edgeThreshold = clamp(Number(options.edgeThreshold ?? 96), 40, 220);
    const fillRatio = clamp(Number(options.fillRatio ?? 0.08), 0.01, 0.9);
    const cacheKey = [
        char,
        safeWidth,
        safeHeight,
        isCjkGlyph ? 1 : 0,
        displayConfig.bold ? 1 : 0,
        clamp(displayConfig.textScale, 0.35, 1.0).toFixed(3),
        edgeThreshold,
        fillRatio
    ].join('|');
    if (glyphBitmapCache.has(cacheKey)) {
        return glyphBitmapCache.get(cacheKey).map((row) => row.slice());
    }

    const superSample = 8;
    const sourceWidth = Math.max(32, safeWidth * superSample);
    const sourceHeight = Math.max(32, safeHeight * superSample);
    const canvas = document.createElement('canvas');
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        const empty = Array.from({ length: safeHeight }, () => Array(safeWidth).fill(0));
        glyphBitmapCache.set(cacheKey, empty);
        return empty.map((row) => row.slice());
    }

    ctx.clearRect(0, 0, sourceWidth, sourceHeight);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const isBold = displayConfig.bold;
    // 使用 Zpix 像素字体
    const weight = '400';
    const fontFamily = '"Zpix", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
    const scale = clamp(displayConfig.textScale, 0.35, 1.0);

    // Zpix 最佳渲染字号是 12px，使用这个固定字号来保持点阵风格
    // 通过计算合适的渲染尺寸，让 12px 字体正确缩放到目标尺寸
    const zpixOptimalSize = 12;
    const renderScale = Math.max(1, Math.min(safeHeight / zpixOptimalSize, 8));
    let fontSize = Math.floor(zpixOptimalSize * renderScale);
    fontSize = Math.max(10, fontSize);
    ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    while (ctx.measureText(char).width > sourceWidth * 0.92 && fontSize > 8) {
        fontSize -= 1;
        ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    }

    // 禁用平滑以获得清脆的像素边
    ctx.imageSmoothingEnabled = false;
    ctx.fillText(char, sourceWidth / 2, sourceHeight / 2);

    const image = ctx.getImageData(0, 0, sourceWidth, sourceHeight).data;
    const alphaMap = new Uint8ClampedArray(sourceWidth * sourceHeight);
    for (let i = 0; i < alphaMap.length; i++) {
        alphaMap[i] = image[i * 4 + 3];
    }

    const bounds = findAlphaBounds(alphaMap, sourceWidth, sourceHeight, 8);
    if (!bounds) {
        const empty = Array.from({ length: safeHeight }, () => Array(safeWidth).fill(0));
        glyphBitmapCache.set(cacheKey, empty);
        return empty.map((row) => row.slice());
    }

    const padX = Math.max(1, Math.floor(bounds.width * (isCjkGlyph ? 0.08 : 0.05)));
    const padY = Math.max(1, Math.floor(bounds.height * (isCjkGlyph ? 0.08 : 0.05)));
    const cropMinX = Math.max(0, bounds.minX - padX);
    const cropMaxX = Math.min(sourceWidth - 1, bounds.maxX + padX);
    const cropMinY = Math.max(0, bounds.minY - padY);
    const cropMaxY = Math.min(sourceHeight - 1, bounds.maxY + padY);
    const cropWidth = cropMaxX - cropMinX + 1;
    const cropHeight = cropMaxY - cropMinY + 1;
    const croppedAlpha = new Uint8ClampedArray(cropWidth * cropHeight);
    for (let y = 0; y < cropHeight; y++) {
        for (let x = 0; x < cropWidth; x++) {
            croppedAlpha[y * cropWidth + x] = alphaMap[(cropMinY + y) * sourceWidth + (cropMinX + x)];
        }
    }

    let grid = resampleAlphaToGrid(croppedAlpha, cropWidth, cropHeight, safeWidth, safeHeight, {
        coverageThreshold: isCjkGlyph ? Math.max(0.08, fillRatio * 0.8) : 0.11,
        scoreThreshold: isCjkGlyph ? 0.12 : 0.1,
        peakThreshold: isCjkGlyph ? Math.max(0.35, edgeThreshold / 255) : 0.28,
        coverageCutoff: isCjkGlyph ? 0.25 : 0.14
    });

    if (isCjkGlyph) {
        grid = bridgeBinaryGridGaps(grid, 2);
        const fill = countOnPixels(grid) / Math.max(1, safeWidth * safeHeight);
        if (fill < 0.09) {
            grid = dilateBinaryGrid(grid, 1);
        }
    }

    glyphBitmapCache.set(cacheKey, grid.map((row) => row.slice()));
    return grid;
}

function buildCjkTextBitmap(text, targetRows = 20) {
    const content = normalizeDisplayText(text) || ' ';
    const safeHeight = Math.max(12, Math.floor(targetRows));
    const chars = Array.from(content);
    const gapBase = Math.max(1, Math.round(clamp(Number(displayConfig.cjkGapCells ?? 0.6), 0, 3)));
    const glyphs = [];
    let totalWidth = 0;

    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        const isCjkGlyph = isCjkChar(ch);
        const glyphWidth = ch === ' '
            ? Math.max(2, Math.round(safeHeight * 0.38))
            : (isCjkGlyph
                ? safeHeight
                : Math.max(4, Math.round(safeHeight * clamp(Number(displayConfig.cjkAdvanceRatio ?? 0.88), 0.45, 1.0) * 0.76)));

        const glyphBitmap = ch === ' '
            ? Array.from({ length: safeHeight }, () => Array(glyphWidth).fill(0))
            : rasterizeGlyphToBinaryGrid(ch, glyphWidth, safeHeight, {
                isCjk: isCjkGlyph,
                edgeThreshold: displayConfig.cjkEdgeThreshold,
                fillRatio: displayConfig.cjkFillRatio
            });

        glyphs.push({ bitmap: glyphBitmap, width: glyphWidth });
        totalWidth += glyphWidth;
        if (i < chars.length - 1) {
            totalWidth += gapBase;
        }
    }

    const bitmap = Array.from({ length: safeHeight }, () => Array(totalWidth).fill(0));
    let offsetX = 0;
    for (let i = 0; i < glyphs.length; i++) {
        const item = glyphs[i];
        for (let y = 0; y < safeHeight; y++) {
            for (let x = 0; x < item.width; x++) {
                if (item.bitmap[y][x]) {
                    bitmap[y][offsetX + x] = 1;
                }
            }
        }
        offsetX += item.width + (i < glyphs.length - 1 ? gapBase : 0);
    }

    return {
        bitmap,
        width: totalWidth,
        height: safeHeight
    };
}

function renderCanvasBitmapToGrid(text, targetCols, targetRows) {
    const width = Math.max(192, targetCols * 36);
    const height = Math.max(96, targetRows * 36);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return Array.from({ length: targetRows }, () => Array(targetCols).fill(0));
    }

    ctx.clearRect(0, 0, width, height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    const content = normalizeDisplayText(text) || ' ';
    const weight = displayConfig.bold ? '700' : '500';
    const fontFamily = '"Zpix", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
    const hasCjk = containsCjkChars(content);
    const chars = Array.from(content);
    const cjkAdvanceRatio = clamp(Number(displayConfig.cjkAdvanceRatio ?? 0.82), 0.45, 1.0);
    const cjkTrackingRatio = clamp(Number(displayConfig.cjkTrackingRatio ?? 0.08), 0, 0.3);
    const cjkEdgeThreshold = clamp(Number(displayConfig.cjkEdgeThreshold ?? 120), 60, 220);
    const cjkFillRatio = clamp(Number(displayConfig.cjkFillRatio ?? 0.12), 0.01, 0.9);

    let fontSize = Math.floor(height * 0.68 * clamp(displayConfig.textScale, 0.35, 1.0));
    fontSize = Math.max(12, Math.min(fontSize, Math.floor(height * 0.9)));
    ctx.font = `${weight} ${fontSize}px ${fontFamily}`;

    const maxTextWidth = width * 0.9;
    const computeTextWidth = () => {
        if (!hasCjk || chars.length <= 1) {
            return ctx.measureText(content).width;
        }
        const tracking = Math.max(0, fontSize * cjkTrackingRatio);
        let total = 0;
        for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            const advance = isCjkChar(ch)
                ? fontSize * cjkAdvanceRatio
                : Math.max(fontSize * 0.35, ctx.measureText(ch).width);
            total += advance;
            if (i < chars.length - 1) {
                total += tracking;
            }
        }
        return total;
    };

    while (computeTextWidth() > maxTextWidth && fontSize > 10) {
        fontSize -= 2;
        ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    }

    if (!hasCjk || chars.length <= 1) {
        ctx.fillText(content, width / 2, height / 2);
    } else {
        const tracking = Math.max(0, fontSize * cjkTrackingRatio);
        const advances = chars.map((ch) => (
            isCjkChar(ch) ? fontSize * cjkAdvanceRatio : Math.max(fontSize * 0.35, ctx.measureText(ch).width)
        ));
        let total = 0;
        for (let i = 0; i < advances.length; i++) {
            total += advances[i];
            if (i < advances.length - 1) {
                total += tracking;
            }
        }
        let cursor = (width - total) / 2;
        for (let i = 0; i < chars.length; i++) {
            const advance = advances[i];
            ctx.fillText(chars[i], cursor + advance * 0.5, height / 2);
            cursor += advance + (i < chars.length - 1 ? tracking : 0);
        }
    }

    const image = ctx.getImageData(0, 0, width, height).data;
    const alphaMap = new Uint8ClampedArray(width * height);
    for (let i = 0; i < alphaMap.length; i++) {
        alphaMap[i] = image[i * 4 + 3];
    }

    const baseThreshold = clamp(displayConfig.threshold, 8, 220);
    const bounds = findAlphaBounds(alphaMap, width, height, Math.max(8, Math.floor(baseThreshold * 0.4)));
    if (!bounds) {
        return Array.from({ length: targetRows }, () => Array(targetCols).fill(0));
    }

    const padX = hasCjk ? Math.max(2, Math.floor(bounds.width * 0.06)) : 2;
    const padY = hasCjk ? Math.max(2, Math.floor(bounds.height * 0.08)) : 2;
    const cropMinX = Math.max(0, bounds.minX - padX);
    const cropMaxX = Math.min(width - 1, bounds.maxX + padX);
    const cropMinY = Math.max(0, bounds.minY - padY);
    const cropMaxY = Math.min(height - 1, bounds.maxY + padY);
    const cropWidth = cropMaxX - cropMinX + 1;
    const cropHeight = cropMaxY - cropMinY + 1;
    const croppedAlpha = new Uint8ClampedArray(cropWidth * cropHeight);
    for (let y = 0; y < cropHeight; y++) {
        for (let x = 0; x < cropWidth; x++) {
            croppedAlpha[y * cropWidth + x] = alphaMap[(cropMinY + y) * width + (cropMinX + x)];
        }
    }

    let grid = resampleAlphaToGrid(croppedAlpha, cropWidth, cropHeight, targetCols, targetRows, {
        coverageThreshold: hasCjk ? cjkFillRatio : 0.16,
        scoreThreshold: hasCjk ? Math.max(0.08, cjkFillRatio * 0.65) : 0.18,
        peakThreshold: hasCjk ? (cjkEdgeThreshold / 255) : (baseThreshold / 255),
        coverageCutoff: hasCjk ? 0.18 : 0.24
    });

    if (hasCjk) {
        grid = bridgeBinaryGridGaps(grid, 3);
    }

    return grid;
}

function renderTextToGrid(text) {
    const rows = Math.max(1, Math.floor(config.gridRows));
    const cols = Math.max(1, Math.floor(config.gridCols));
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    if (!isDisplayMode()) {
        return grid;
    }
    const content = normalizeDisplayText(text);
    const activeCols = decideActiveColumns(content, cols);
    const startCol = Math.floor((cols - activeCols) / 2);

    let compactGrid;
    if (containsOnlyPixelFontChars(content)) {
        const built = buildPixelFontBitmap(content || ' ');
        compactGrid = scaleBitmapToGrid(built.bitmap, built.width, built.height, activeCols, rows);
    } else if (containsCjkChars(content)) {
        const built = buildCjkTextBitmap(content || ' ', getCjkTargetRows());
        const cjkFillRatio = clamp(Number(displayConfig.cjkFillRatio ?? 0.08), 0.01, 0.9);
        compactGrid = scaleBitmapToGrid(
            built.bitmap,
            built.width,
            built.height,
            activeCols,
            rows,
            Math.max(0.04, cjkFillRatio * 0.45)
        );
        const thinPasses = Math.max(0, Math.floor(displayConfig.cjkThinPasses ?? 0));
        if (thinPasses > 0) {
            compactGrid = thinBinaryGridZhangSuen(compactGrid, Math.min(6, thinPasses));
        }
    } else {
        compactGrid = renderCanvasBitmapToGrid(content || ' ', activeCols, rows);
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < activeCols; col++) {
            grid[row][startCol + col] = compactGrid[row][col];
        }
    }

    return grid;
}

async function previewCurrentSequenceText() {
    if (!isDisplayMode()) {
        return;
    }
    await ensureFontLoaded('"Zpix"');
    const items = parseDisplaySequence(displayConfig.sequence);
    const text = items.length > 0 ? items[0] : '';
    playbackState.lastText = text;
    ensureDisplayGridCapacity(text);
    const grid = renderTextToGrid(text);
    applyTextGrid(grid);
}

function stopPlayback(options = {}) {
    const shouldReset = options.resetPose === true;
    playbackState.running = false;
    playbackState.runId += 1;
    if (shouldReset) {
        resetPixelsToInitialFace();
    }
}

async function startPlayback() {
    if (!isDisplayMode()) {
        return;
    }
    // Ensure font is ready before we start rendering frames
    await ensureFontLoaded('"Zpix"');

    const items = parseDisplaySequence(displayConfig.sequence);
    if (items.length === 0 || pixels.length === 0) {
        return;
    }

    stopPlayback();
    playbackState.running = true;
    const runId = playbackState.runId;
    setPanelVisible(false);

    let index = 0;
    while (playbackState.running && runId === playbackState.runId) {
        const text = items[index];
        playbackState.lastText = text;
        ensureDisplayGridCapacity(text);
        const grid = renderTextToGrid(text);
        applyTextGrid(grid);
        await waitMs(Math.max(200, Math.floor(displayConfig.intervalMs)));
        if (!playbackState.running || runId !== playbackState.runId) {
            break;
        }
        index += 1;
        if (index >= items.length) {
            if (displayConfig.loop) {
                index = 0;
            } else {
                break;
            }
        }
    }

    playbackState.running = false;
}

function initResources() {
    // 1. Plate Geometry
    const PLATE_WIDTH = UNIT_SIZE * PLATE_SCALE;
    plateGeometry = createRoundedPlateGeometry(
        UNIT_SIZE,
        PLATE_WIDTH,
        PLATE_THICKNESS,
        BEVEL_THICKNESS,
        CORNER_RADIUS
    );

    // 2. Inner Prism Geometry
    innerGeometry = createInnerPrismGeometry(
        innerParams.size,
        innerParams.length,
        innerParams.radius,
        innerParams.bevel
    );

    // 3. Materials
    const colors = [
        buildFaceColor(1),
        buildFaceColor(2),
        buildFaceColor(3)
    ];

    materials = colors.map(c => new THREE.MeshPhysicalMaterial({
        color: c,
        roughness: materialParams.roughness,
        metalness: materialParams.metalness,
        clearcoat: materialParams.clearcoat,
        clearcoatRoughness: materialParams.clearcoatRoughness,
        envMapIntensity: materialParams.envMapIntensity,
        side: THREE.DoubleSide
    }));

    innerMaterial = new THREE.MeshPhysicalMaterial({
        color: innerParams.color,
        roughness: 0.14,
        metalness: 0.8,
        clearcoat: 0.4,
        clearcoatRoughness: 0.08,
        envMapIntensity: 2.4
    });
}

function createPrismPrototype() {
    const group = new THREE.Group();

    // 1. Create 3 Plates
    const apothem = UNIT_SIZE / (2 * Math.sqrt(3));
    const distance = apothem - PLATE_THICKNESS / 2 + GAP_OFFSET;

    // Angles: Top (90), Right (-30), Left (210)
    const angles = [Math.PI / 2, -Math.PI / 6, 7 * Math.PI / 6];

    for (let i = 0; i < 3; i++) {
        const plate = new THREE.Mesh(plateGeometry, materials[i]);
        plate.castShadow = true;
        plate.receiveShadow = true;

        const angle = angles[i];
        plate.position.set(0, distance * Math.sin(angle), distance * Math.cos(angle));
        plate.rotation.x = -angle;

        group.add(plate);
    }

    // 2. Create Inner Prism
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    inner.rotation.y = Math.PI / 2; // Rotate to align X axis
    inner.position.set(innerParams.x, innerParams.y, innerParams.z);

    group.add(inner);

    return group;
}

function createRoundedPlateGeometry(width, height, thickness, bevel, radius) {
    const shape = new THREE.Shape();
    const w = width;
    const h = height;
    const r = radius;

    const x = -w / 2;
    const y = -h / 2;

    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const extrudeSettings = {
        steps: 1,
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 3
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.computeBoundingBox();
    const centerOffset = -0.5 * (geometry.boundingBox.max.z - geometry.boundingBox.min.z);
    geometry.translate(0, 0, centerOffset);

    return geometry;
}

function createInnerPrismGeometry(size, length, radius, bevel) {
    const shape = new THREE.Shape();
    const R = size;
    const r = radius;

    const angleStart = -Math.PI / 2;
    const angleStep = Math.PI * 2 / 3;
    const dist = R - 2 * r;

    for (let i = 0; i < 3; i++) {
        const angle = angleStart + i * angleStep;
        const cx = dist * Math.cos(angle);
        const cy = dist * Math.sin(angle);
        shape.absarc(cx, cy, r, angle - Math.PI / 3, angle + Math.PI / 3, false);
    }
    shape.closePath();

    const extrudeSettings = {
        steps: 1,
        depth: length,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 5
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center along Z only
    geometry.translate(0, 0, -length / 2);
    return geometry;
}

function updateMouseFromClientPosition(clientX, clientY) {
    if (!renderer || !renderer.domElement) {
        return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
        return;
    }
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

function resolvePixelGroupFromObject(obj) {
    if (!obj) {
        return null;
    }
    if (obj.userData && obj.userData.parentGroup) {
        return obj.userData.parentGroup;
    }
    let curr = obj;
    while (curr && curr.parent && !pixels.includes(curr)) {
        curr = curr.parent;
    }
    if (curr && pixels.includes(curr)) {
        return curr;
    }
    return null;
}

function pickPixelGroupAtClient(clientX, clientY) {
    updateMouseFromClientPosition(clientX, clientY);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    for (let i = 0; i < intersects.length; i++) {
        const group = resolvePixelGroupFromObject(intersects[i].object);
        if (group && !group.userData.isRim) {
            return group;
        }
    }
    return null;
}

function triggerFreeModeFlipAt(clientX, clientY) {
    if (!isFreeMode()) {
        return;
    }
    const group = pickPixelGroupAtClient(clientX, clientY);
    if (!group) {
        freeSwipeState.lastGridKey = '';
        return;
    }
    const row = Number.isFinite(group.userData.gridRow) ? group.userData.gridRow : 0;
    const col = Number.isFinite(group.userData.gridCol) ? group.userData.gridCol : 0;
    const key = gridKey(row, col);
    if (key === freeSwipeState.lastGridKey) {
        return;
    }
    freeSwipeState.lastGridKey = key;
    queueGroupStepFlip(group, 1, 0.16);
}

function onPointerDown(event) {
    updateMouseFromClientPosition(event.clientX, event.clientY);
    if (!isFreeMode() || event.button !== 0) {
        return;
    }
    freeSwipeState.pointerDown = true;
    freeSwipeState.pointerId = event.pointerId;
    freeSwipeState.lastGridKey = '';
    if (renderer && renderer.domElement && typeof renderer.domElement.setPointerCapture === 'function') {
        try {
            renderer.domElement.setPointerCapture(event.pointerId);
        } catch (error) {
            // Ignore pointer capture errors from non-primary pointers.
        }
    }
    event.preventDefault();
    triggerFreeModeFlipAt(event.clientX, event.clientY);
}

function onPointerMove(event) {
    updateMouseFromClientPosition(event.clientX, event.clientY);
    if (!isFreeMode()) {
        return;
    }
    if (!freeSwipeState.pointerDown || freeSwipeState.pointerId !== event.pointerId) {
        return;
    }
    event.preventDefault();
    triggerFreeModeFlipAt(event.clientX, event.clientY);
}

function onPointerUp(event) {
    if (freeSwipeState.pointerId !== event.pointerId) {
        return;
    }
    if (renderer && renderer.domElement && typeof renderer.domElement.releasePointerCapture === 'function') {
        try {
            renderer.domElement.releasePointerCapture(event.pointerId);
        } catch (error) {
            // Ignore release errors.
        }
    }
    resetFreeSwipeState();
}

function onPointerCancelOrLeave(event) {
    if (event && freeSwipeState.pointerId !== null && event.pointerId !== undefined && freeSwipeState.pointerId !== event.pointerId) {
        return;
    }
    resetFreeSwipeState();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (isSpringFestivalMode() && !experienceState.active) {
        applyWallOverviewCamera({ fov: Math.min(config.camFov, 32) });
    }
}

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    updateMusicDrivenEffects();
    updateMusicOrchestration(now);
    updateLyricSync(now);
    updatePresetTransition(now);
    updateCinematicCamera(now);
    updateTransportUi();

    pixels.forEach(group => {
        if (group.userData.isAnimating) {
            // 默认阻尼 0.1；春晚行波可按组覆盖
            const speed = clamp(group.userData.motionDamping || 0.1, 0.04, 0.25);
            const diff = group.userData.targetRotationX - group.rotation.x;

            if (Math.abs(diff) < 0.005) {
                group.rotation.x = group.userData.targetRotationX;
                group.userData.isAnimating = false;
                group.userData.motionDamping = null;
                const settledFace = Number.isFinite(group.userData.targetFaceIndex)
                    ? normalizeFaceIndex(group.userData.targetFaceIndex)
                    : normalizeFaceIndex(Math.round(
                        (group.userData.targetRotationX - group.userData.baseRotationX) / ((Math.PI * 2) / 3)
                    ));
                group.userData.faceIndex = settledFace;
                group.userData.targetFaceIndex = settledFace;
                group.userData.currentOn = settledFace !== 0;
                group.userData.targetOn = group.userData.currentOn;
            } else {
                group.rotation.x += diff * speed;
            }
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

window.onload = init;
