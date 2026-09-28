import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

/** 原型运行时自行绑定 DOM，暂不启用 StrictMode 双挂载 */
createRoot(document.getElementById("root")!).render(<App />);
