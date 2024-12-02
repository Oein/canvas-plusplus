import { registerFunction } from "..";
import { getState, setState } from "../../utils/state";

registerFunction("SHIFTTOOL", () => {
  setState("SHIFTTOOL", !getState("SHIFTTOOL"));

  const shiftToolButton = document.querySelector(
    ".function-button[data-function='SHIFTTOOL']"
  );
  if (!shiftToolButton) return;
  shiftToolButton.classList.toggle("active", getState("SHIFTTOOL"));
});
