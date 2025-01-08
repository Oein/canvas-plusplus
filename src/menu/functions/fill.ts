import { registerFunction } from "..";
import { getState, setState } from "../../utils/state";

registerFunction("FILLTOOL", () => {
  setState("FILLTOOL", !getState("FILLTOOL"));

  const fillToolButton = document.querySelector(
    ".function-button[data-function='FILLTOOL']"
  );
  if (!fillToolButton) return;
  fillToolButton.classList.toggle("active", getState("FILLTOOL"));
});

(() => {
  const fillToolButton = document.querySelector(
    ".function-button[data-function='FILLTOOL']"
  );
  if (!fillToolButton) return;
  fillToolButton.classList.toggle("active", getState("FILLTOOL"));
})();
