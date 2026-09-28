/**
 * 将规划/PRD/字段设计等文档移入 文档稿/，保留 React 工程根文件。
 * 运行：node scripts/organize-docs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "文档稿");

const keep = new Set([
  "prototype-kis-v3.0-p01.html",
  "package.json",
  "package-lock.json",
  "README.md",
  "index.html",
  "vite.config.ts",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  ".gitignore",
  ".oxlintrc.json",
  "src",
  "scripts",
  "public",
  "node_modules",
  "dist",
  "文档稿",
]);

fs.mkdirSync(docsDir, { recursive: true });

const moved = [];
for (const name of fs.readdirSync(root)) {
  if (keep.has(name)) continue;
  if (name === ".DS_Store") continue;
  const from = path.join(root, name);
  const to = path.join(docsDir, name);
  if (fs.existsSync(to)) {
    console.error("Skip (exists):", name);
    continue;
  }
  fs.renameSync(from, to);
  moved.push(name);
}

console.log(`Moved ${moved.length} items into 文档稿/`);
moved.forEach((n) => console.log(" ", n));
