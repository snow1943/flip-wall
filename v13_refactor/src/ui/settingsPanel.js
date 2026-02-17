function setGuiFolderVisible(folder, visible) {
    if (!folder || !folder.domElement) {
        return;
    }
    folder.domElement.style.display = visible ? '' : 'none';
}

function refreshSpringEffectSettingsVisibility() {
    const refs = guiRefs && guiRefs.springEffectFolders;
    if (!refs) {
        return;
    }
    const inSpringMode = isSpringFestivalMode();
    const effect = String(springWaveConfig.effect || '效果1-行波');
    const isWaveEffect = effect === '效果1-行波' || effect === '效果2-行内波';

    setGuiFolderVisible(refs.playback, inSpringMode);
    setGuiFolderVisible(refs.music, inSpringMode);
    setGuiFolderVisible(refs.globalSync, inSpringMode);
    setGuiFolderVisible(refs.wave, inSpringMode && isWaveEffect);
    setGuiFolderVisible(refs.sweep, inSpringMode && effect === '效果3-扫光');
    setGuiFolderVisible(refs.dualTrack, inSpringMode && effect === '效果4-双轨流色');
    setGuiFolderVisible(refs.equalizer, inSpringMode && effect === '效果5-柱形均衡波');
    setGuiFolderVisible(refs.mosaic, inSpringMode && effect === '效果6-矩形闪烁块');
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
        applyPreset(value);
    });
    presetFolder.add({ applyNow: () => applyPreset(presetState.theme) }, 'applyNow').name('一键应用');
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

    const springWaveFolder = gui.addFolder('春晚播放');
    springWaveFolder.add(
        springWaveConfig,
        'effect',
        ['效果1-行波', '效果2-行内波', '效果3-扫光', '效果4-双轨流色', '效果5-柱形均衡波', '效果6-矩形闪烁块']
    ).name('播放效果').onChange(() => {
        if (isSpringFestivalMode()) {
            createPixelWall();
        }
        refreshSpringEffectSettingsVisibility();
    });

    const springPlaybackFolder = springWaveFolder.addFolder('播放控制');
    springPlaybackFolder.add({ startNow: () => { startSpringPlaybackUnified(); } }, 'startNow').name('开始播放');
    springPlaybackFolder.add({ stopNow: () => stopSpringPlaybackUnified({ resetPose: true, keepSource: true }) }, 'stopNow').name('停止播放');
    springPlaybackFolder.add({ clearSource: () => stopSpringPlaybackUnified({ resetPose: false, keepSource: false }) }, 'clearSource').name('停止并清空音源');
    springPlaybackFolder.add(musicDriveUi, 'status').name('当前状态').listen();
    springPlaybackFolder.open();

    const musicFolder = springWaveFolder.addFolder('音乐输入');
    musicFolder.add(musicDriveConfig, 'sourceUrl').name('音视频链接');
    musicFolder.add({ loadLink: () => { loadMusicFromUrl(); } }, 'loadLink').name('加载链接并播放');
    musicFolder.add({ pickLocal: () => pickLocalMusicFile() }, 'pickLocal').name('上传本地并播放');
    musicFolder.add(musicDriveConfig, 'sourceLoop').name('音源循环');
    musicFolder.add(musicDriveConfig, 'autoTrigger').name('节拍触发重启');
    const musicAnalysisFolder = musicFolder.addFolder('音乐跟随灵敏度');
    musicAnalysisFolder.add(musicDriveConfig, 'smoothing', 0.2, 0.95).step(0.01).name('能量平滑');
    musicAnalysisFolder.add(musicDriveConfig, 'gainBoost', 0.5, 3.0).step(0.05).name('能量增益');
    musicAnalysisFolder.add(musicDriveConfig, 'beatThreshold', 0.08, 0.95).step(0.01).name('节拍阈值');
    musicAnalysisFolder.add(musicDriveConfig, 'beatFluxThreshold', 0.005, 0.2).step(0.001).name('突增阈值');
    musicAnalysisFolder.add(musicDriveConfig, 'beatCooldownMs', 80, 800).step(10).name('节拍冷却(ms)');
    musicAnalysisFolder.add(musicDriveConfig, 'triggerIntervalMs', 80, 1200).step(10).name('触发间隔(ms)');

    const globalSyncFolder = springWaveFolder.addFolder('全效果音乐联动');
    globalSyncFolder.add(springWaveConfig, 'musicSyncAllEffects').name('启用全效果联动');
    globalSyncFolder.add(springWaveConfig, 'musicSyncMode', ['关闭', '跟随音频能量', '节拍优先']).name('联动模式');
    globalSyncFolder.add(springWaveConfig, 'musicSyncStrength', 0, 1).step(0.01).name('联动强度');
    globalSyncFolder.add(springWaveConfig, 'musicSyncMinMs', 20, 260).step(1).name('联动最快(ms)');
    globalSyncFolder.add(springWaveConfig, 'musicSyncMaxMs', 60, 900).step(1).name('联动最慢(ms)');
    globalSyncFolder.add(springWaveConfig, 'musicSyncBeatPulse', 0, 1).step(0.01).name('拍点冲击');

    const waveFolder = springWaveFolder.addFolder('效果1/2 行波参数');
    waveFolder.add(springWaveConfig, 'direction', ['从上到下', '从下到上']).name('行进方向');
    waveFolder.add(springWaveConfig, 'rowIntervalMs', 0, 800).step(10).name('行波延迟(ms)');
    waveFolder.add(springWaveConfig, 'stagePauseMs', 0, 600).step(10).name('2面后停顿(ms)');
    waveFolder.add(springWaveConfig, 'innerDelayMs', 0, 80).step(1).name('行内延迟(ms)');
    waveFolder.add(springWaveConfig, 'innerDirection', ['从左到右', '从右到左']).name('行内方向');
    waveFolder.add(springWaveConfig, 'damping', 0.04, 0.25).step(0.005).name('阻尼系数');

    const sweepFolder = springWaveFolder.addFolder('效果3 扫光参数');
    sweepFolder.add(springWaveConfig, 'direction', ['从上到下', '从下到上']).name('扫光方向');
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

    const dualTrackFolder = springWaveFolder.addFolder('效果4 双轨流色参数');
    dualTrackFolder.add(springWaveConfig, 'outerFace', { 面1: 1, 面2: 2 }).name('外侧颜色面');
    dualTrackFolder.add(springWaveConfig, 'innerBaseFace', { 面1: 1, 面2: 2 }).name('中间基础面');
    dualTrackFolder.add(springWaveConfig, 'innerFlowFace', { 面0: 0, 面1: 1, 面2: 2 }).name('中间流动面');
    dualTrackFolder.addColor(springWaveConfig, 'outerTrackColor').name('外轨颜色');
    dualTrackFolder.addColor(springWaveConfig, 'innerBaseColor').name('中间基础色');
    dualTrackFolder.addColor(springWaveConfig, 'innerFlowColor').name('中间流动色');
    dualTrackFolder.add(springWaveConfig, 'flowRenderMode', ['翻转流动', '颜色流动(不翻转)']).name('呈现方式');
    dualTrackFolder.add(springWaveConfig, 'flowDirection', ['正向', '反向']).name('流动方向');
    dualTrackFolder.add(springWaveConfig, 'flowStepMs', 20, 420).step(5).name('流动步进(ms)');
    dualTrackFolder.add(springWaveConfig, 'flowCycles', 1, 12).step(1).name('流动循环');
    dualTrackFolder.add(springWaveConfig, 'flowBandSize', 1, 4).step(1).name('流动带宽');
    dualTrackFolder.add(springWaveConfig, 'damping', 0.04, 0.25).step(0.005).name('阻尼系数');

    const equalizerFolder = springWaveFolder.addFolder('效果5 柱形均衡波参数');
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
    equalizerFolder.add(springWaveConfig, 'damping', 0.04, 0.25).step(0.005).name('阻尼系数');

    const mosaicFolder = springWaveFolder.addFolder('效果6 矩形闪烁块参数');
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
    mosaicFolder.add(springWaveConfig, 'damping', 0.04, 0.25).step(0.005).name('阻尼系数');

    guiRefs.springWaveFolder = springWaveFolder;
    guiRefs.springEffectFolders = {
        playback: springPlaybackFolder,
        music: musicFolder,
        globalSync: globalSyncFolder,
        wave: waveFolder,
        sweep: sweepFolder,
        dualTrack: dualTrackFolder,
        equalizer: equalizerFolder,
        mosaic: mosaicFolder
    };
    refreshSpringEffectSettingsVisibility();

    const folder = gui.addFolder('初始角度调整');

    const updateRotations = () => {
        pixels.forEach((p) => {
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
    camFolder.add(config, 'camZ', 0, 100).name('位置 Z').onChange(updateCamera);
    camFolder.add(config, 'camFov', 18, 65).name('透视强度(FOV)').onChange(updateCamera);
    camFolder.open();

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

    lightFolder.add(config, 'spotLightX', -50, 50).name('主光 X').onChange(updateLights);
    lightFolder.add(config, 'spotLightY', -50, 50).name('主光 Y').onChange(updateLights);
    lightFolder.add(config, 'spotLightZ', 0, 100).name('主光 Z').onChange(updateLights);
    lightFolder.add(config, 'spotLightIntensity', 0, 4).name('主光强度').onChange(updateLights);
    lightFolder.add(config, 'spotLightAngle', 0, Math.PI / 2).name('光照角度').onChange(updateLights);
    lightFolder.add(config, 'spotLightPenumbra', 0, 1).name('边缘柔化').onChange(updateLights);
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
