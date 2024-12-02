import { setState } from "../utils/state";

export default function setupStroke() {
  const strks = document.querySelectorAll("#strokes > .strkel");
  const stsel = document.getElementById("selstk");
  const strokeSizez = [3, 9, 15];
  strks.forEach((e, i) => {
    e.addEventListener("click", () => {
      if (stsel) stsel.style.left = `calc(1.5rem * ${i})`;
      setState("STROKE", strokeSizez[i]);
    });
  });
}
