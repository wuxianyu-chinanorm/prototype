# KIS 主题（Classic + 扩展风格）

Classic 仅 CSS 变量与 legacy 样式；其余风格 = **主题 CSS**（`src/styles/themes/<id>.css`）+ **展示层**（`src/themes/presentation/`）。

| id | 定位 |
|----|------|
| beacon | 访视控制塔 KPI |
| clarity | 空气感 CRM 卡片 |
| atlas | 合规分段筛选 |
| lumen | 交互数据网格（悬停操作 / 表头图标 / 演示编辑） |
| notion | Notion 式文档 + 数据库（重组 DOM / 视图切换 / 多选列） |

## 新增主题四步

1. 在 `registry.ts` 的 `KIS_THEMES` 增加 `{ id, label, hint }`。
2. 新建 `src/styles/themes/<id>.css`，选择器根：`html[data-kis-theme="<id>"]`。
3. 在 `src/styles/themes/index.css` import 新文件。
4. 若需布局/DOM 增强：实现 `ThemePresentationModule`（见 `presentation/beacon.ts`），在 `presentation/index.ts` 注册。

## 运行时

- `engine.applyKisTheme`：写 `data-kis-theme`、localStorage、挂载/卸载 presentation。
- `presentation/shared.ts`：MutationObserver 在 legacy DOM 切换面板时重新增强可见区域。
- 展示层只作用于 `#kis-prototype-host`（KIS 主文档），不进入 staff/subject iframe。
