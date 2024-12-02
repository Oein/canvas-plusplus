import { registerFunction } from "..";

registerFunction("wincap", () => {
  // @ts-ignore
  window.require("electron").ipcRenderer.send("wincap");
});
