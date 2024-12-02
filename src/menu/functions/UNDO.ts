import { registerFunction } from "..";
import { manager } from "../../main";

registerFunction("UNDO", () => {
  manager.focused.undo();
  manager.focused.requestRender();
});
