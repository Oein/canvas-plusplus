import { manager } from "../main";
import { addUpListener } from "../utils/listener";

export const updateIndicator = () => {
  const indi = document.getElementById("pageindi");
  if (!indi) return;
  indi.innerText = `${manager.focusedInstance + 1}/${manager.instances.length}`;
};

export default function setupPage() {
  addUpListener(document.getElementById("right")!, () => {
    manager.nextInstance();
    updateIndicator();
  });

  addUpListener(document.getElementById("left")!, () => {
    manager.prevInstance();
    updateIndicator();
  });
}
