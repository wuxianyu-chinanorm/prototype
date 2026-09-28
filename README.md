# KIS P01 前端（React + 原型）

本目录为 **同一项目文件夹**：`prototype-kis-v3.0-p01.html`（源原型）与 React/Vite 工程（`package.json`、`src/`）并列，便于 Git 协作。

## 快速开始

```bash
# 在本目录（含 prototype-kis-v3.0-p01.html 与 package.json）执行
npm install
npm run dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

单独打开静态原型（不经过 React）：

- 直接打开 `prototype-kis-v3.0-p01.html`
- 或 `public/prototype-kis-v3.0-p01.html`（与提取脚本同步的副本）

## 文件关系

| 路径 | 说明 |
|------|------|
| `prototype-kis-v3.0-p01.html` | **原型源文件**（改 IA/交互时优先改此文件） |
| `public/prototype-kis-v3.0-p01.html` | 提取脚本复制的静态对照 |
| `src/legacy/prototype-body.html` | 提取的 body markup（React 挂载） |
| `src/legacy/prototype.runtime.js` | 提取的交互脚本 |
| `src/styles/tokens.css` | 设计令牌 |
| `src/styles/legacy/prototype.css` | 原型样式（逐步拆到 `styles/features/`） |

改完源 HTML 后同步到 React：

```bash
npm run extract-prototype
```

## 目录结构

```
prototype-kis-v3.0-p01.html   # 单文件原型源稿
package.json
src/ … public/ scripts/
文档稿/                       # PRD、规划 HTML、CSV、脚本等（不参与构建）
```

规划、PRD、字段设计等 **101+ 份材料** 已归入 **`文档稿/`**，不参与 `npm run dev` 构建。新增文档请直接放进 `文档稿/`。

## 协作改样式

1. **全局令牌**：`src/styles/tokens.css`
2. **业务增量**：`src/styles/features/<域名>.css`
3. 避免在 `legacy/prototype.css` 长期堆新样式——确认后拆到 feature 文件
