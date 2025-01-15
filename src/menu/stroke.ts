import { addUpListener } from "../utils/listener";
import { setState } from "../utils/state";

export default function setupStroke() {
  const strks = document.querySelectorAll("#strokes > .strkel");
  const stsel = document.getElementById("selstk");
  const strokeSizez = [3, 9, 15];
  let selected = 0;
  strks.forEach((e, i) => {
    (
      strks[i].children[0] as HTMLDivElement
    ).style.width = `${strokeSizez[i]}px`;
    addUpListener(e, () => {
      if (selected === i) {
      }
      selected = i;
      if (stsel) stsel.style.left = `calc(1.5rem * ${i})`;
      setState("STROKE", strokeSizez[i]);
    });
  });
}
