# v13_refactor

基于 `index_v12.html` 的非破坏式重构版本。

## 运行方式
- 直接用静态服务器打开目录（推荐）：
  - `cd /Users/hiram/vibecoding/flip_wall`
  - `python3 -m http.server 5173`
  - 浏览器访问 `http://localhost:5173/v13_refactor/index.html`

## 目录结构
- `index.html` 页面入口
- `styles/main.css` 样式
- `src/main.js` 主逻辑
- `src/config/` 可复用配置模块
