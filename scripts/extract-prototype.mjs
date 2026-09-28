/**
 * 从 prototype-kis-v3.0-p01.html 提取样式与主内容片段，供 React 工程引用。
 * 运行：node scripts/extract-prototype.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const protoPath = path.join(root, "prototype-kis-v3.0-p01.html");

const html = fs.readFileSync(protoPath, "utf8");

const styleRe = /<style>([\s\S]*?)<\/style>/g;
const styles = [];
let m;
while ((m = styleRe.exec(html)) !== null) {
  styles.push(m[1].trim());
}
const fullCss = styles.join("\n\n");

const tokensMatch = fullCss.match(/:root\s*\{[\s\S]*?\}/);
const tokensCss = tokensMatch ? tokensMatch[0] : "";

const restCss = tokensMatch ? fullCss.replace(tokensMatch[0], "/* tokens moved to tokens.css */\n") : fullCss;

const stylesDir = path.join(root, "src", "styles");
const legacyDir = path.join(root, "src", "legacy", "pages");
fs.mkdirSync(path.join(stylesDir, "legacy"), { recursive: true });
fs.mkdirSync(legacyDir, { recursive: true });

fs.writeFileSync(path.join(stylesDir, "tokens.css"), tokensCss + "\n");
fs.writeFileSync(path.join(stylesDir, "legacy", "prototype.css"), restCss + "\n");

const mainMatch = html.match(/<main class="main" id="main-content">([\s\S]*?)<\/main>/);
if (mainMatch) {
  fs.writeFileSync(path.join(legacyDir, "main-content.html"), mainMatch[1].trim() + "\n");
}

const pageIds = [
  "page-recruit",
  "page-prep",
  "page-deliver",
  "page-schedule",
  "page-visit-collect",
  "page-visit",
  "page-collect",
  "page-placeholder",
];

for (const id of pageIds) {
  const re = new RegExp(`<div id="${id}"[^>]*>([\\s\\S]*?)<\\/div>\\s*(?=<div id="page-|<\\/main>)`);
  const pm = html.match(re);
  if (pm) {
    fs.writeFileSync(path.join(legacyDir, `${id}.html`), pm[1].trim() + "\n");
  }
}

const bodyMatch = html.match(/<body>([\s\S]*?)<script>/);
if (bodyMatch) {
  fs.writeFileSync(path.join(root, "src", "legacy", "prototype-body.html"), bodyMatch[1].trim() + "\n");
}

const scriptMatch = html.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/);
if (scriptMatch) {
  fs.writeFileSync(
    path.join(root, "src", "legacy", "prototype.runtime.js"),
    "// Auto-extracted from prototype-kis-v3.0-p01.html — migrate logic to React gradually.\n" +
      scriptMatch[1].trim() +
      "\n"
  );
}

fs.copyFileSync(protoPath, path.join(root, "public", "prototype-kis-v3.0-p01.html"));

console.log("Extracted:");
console.log("  src/styles/tokens.css");
console.log("  src/styles/legacy/prototype.css");
console.log("  src/legacy/pages/*.html");
console.log("  src/legacy/prototype-body.html");
console.log("  src/legacy/prototype.runtime.js");
console.log("  public/prototype-kis-v3.0-p01.html");
