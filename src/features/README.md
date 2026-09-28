# Features（按业务域拆分）

迁移顺序建议：

1. `layout/` — AppBar、侧栏、阶段切换（从 legacy 抽 React 组件）
2. `visit-collect/` — 访视执行台（前台登记 / 导检进度 / CRF 作业台）
3. `prep/`、`recruit/`、`deliver/` … — 各阶段主内容

每个 feature 目录建议：

```
visit-collect/
  components/
  VisitCollectPage.tsx
  visit-collect.css   # 仅本域样式，勿改 legacy 大文件
```
