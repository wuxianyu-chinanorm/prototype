import { PrototypeShell } from "./PrototypeShell";
import { ThemePresentationHost } from "../themes/ThemePresentationHost";
import { ThemeSwitcher } from "../themes/ThemeSwitcher";

export default function App() {
  return (
    <>
      <PrototypeShell />
      <ThemePresentationHost />
      <ThemeSwitcher />
    </>
  );
}
