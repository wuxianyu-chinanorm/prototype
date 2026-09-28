import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** 生产构建设 VITE_BASE=/prototype/；本地 dev 不设，仍从 / 访问 */
function appBase(): string {
  const raw = (process.env.VITE_BASE ?? "/").trim() || "/";
  if (raw === "/") return "/";
  const withLead = raw.startsWith("/") ? raw : `/${raw}`;
  return withLead.endsWith("/") ? withLead : `${withLead}/`;
}

/** 让 /staff/*、/subject/* 深链刷新仍落到对应 MPA 入口 */
function mpaFallback(): Plugin {
  return {
    name: "kis-mpa-fallback",
    configureServer(server) {
      return () => {
        server.middlewares.use((req, _res, next) => {
          const raw = req.url ?? "";
          const pathname = raw.split("?")[0] ?? "";
          if (pathname.includes(".")) return next();
          if (pathname === "/staff" || pathname.startsWith("/staff/")) {
            req.url = "/staff/index.html" + (raw.includes("?") ? raw.slice(raw.indexOf("?")) : "");
          } else if (pathname === "/subject" || pathname.startsWith("/subject/")) {
            req.url = "/subject/index.html" + (raw.includes("?") ? raw.slice(raw.indexOf("?")) : "");
          }
          next();
        });
      };
    },
  };
}

export default defineConfig({
  base: appBase(),
  plugins: [react(), tailwindcss(), mpaFallback()],
  resolve: {
    alias: {
      "@vfp/guided-tour/style.css": path.resolve(
        rootDir,
        "packages/guided-tour/src/ui/tour.css",
      ),
      "@vfp/guided-tour": path.resolve(rootDir, "packages/guided-tour/src/index.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "index.html"),
        subject: path.resolve(rootDir, "subject/index.html"),
        staff: path.resolve(rootDir, "staff/index.html"),
      },
    },
  },
  server: {
    port: 5173,
  },
});
