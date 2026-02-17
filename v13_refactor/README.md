# v13_refactor

基于 `index_v12.html` 的非破坏式重构版本，当前可作为主开发入口。

## 快速开始
1. 进入仓库根目录：`cd /Users/hiram/vibecoding/flip_wall`
2. 启动静态服务：`python3 -m http.server 5173`
3. 打开页面：`http://localhost:5173/v13_refactor/index.html`

## 项目结构（已规整）
- `index.html` 页面入口与脚本装配顺序
- `styles/main.css` 页面样式
- `src/main.js` 核心渲染与交互逻辑
- `src/ui/settingsPanel.js` 设置面板（dat.GUI）构建逻辑
- `src/config/colorPresets.js` 配色模板
- `src/config/springLayout.js` 春晚布局数据
- `src/config/pixelFont.js` 像素字体数据
- `vendor/fonts/` 本地字体资源

## 约定
- 业务逻辑优先放在 `src/main.js`
- 设置面板相关改动优先放在 `src/ui/settingsPanel.js`
- 可复用静态配置优先放在 `src/config/`
