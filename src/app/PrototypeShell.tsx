import { useEffect, useRef } from "react";
import prototypeBodyHtml from "../legacy/prototype-body.html?raw";
import prototypeRuntime from "../legacy/prototype.runtime.js?raw";

const RUNTIME_FLAG = "__kisPrototypeRuntimeLoaded__";

/**
 * 挂载原 HTML 原型 DOM + 运行时脚本。
 * 样式已拆到 src/styles/，逻辑将逐步迁移为 React features。
 */
export function PrototypeShell() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((window as unknown as Record<string, boolean>)[RUNTIME_FLAG]) return;
    (window as unknown as Record<string, boolean>)[RUNTIME_FLAG] = true;
    const script = document.createElement("script");
    script.id = "kis-prototype-runtime";
    script.text = prototypeRuntime;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      ref={hostRef}
      id="kis-prototype-host"
      className="kis-prototype-host"
      dangerouslySetInnerHTML={{ __html: prototypeBodyHtml }}
    />
  );
}
