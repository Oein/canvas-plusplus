import { registerFunction } from "..";
import { manager } from "../../main";

registerFunction("UNDO", () => {
  manager.focused.undo();
  manager.focused.requestRender();
});

const ua = navigator.userAgent.toLowerCase();
const isMac =
  ua.indexOf("mac") > -1 &&
  ua.indexOf("os") > -1 &&
  !(
    ua.indexOf("iphone") > -1 ||
    ua.indexOf("ipad") > -1 ||
    ua.indexOf("windows") > -1
  );

document.addEventListener("keydown", (e) => {
  if (e.repeat == false && (isMac ? e.metaKey : e.ctrlKey) && e.key === "z") {
    manager.focused.undo();
    manager.focused.requestRender();
  }
});
