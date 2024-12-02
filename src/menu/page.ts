import { manager } from "../main";

export default function setupPage() {
  const updateIndicator = () => {
    const indi = document.getElementById("pageindi");
    if (!indi) return;
    indi.innerText = `${manager.focusedInstance + 1}/${
      manager.instances.length
    }`;
  };
  document.getElementById("right")?.addEventListener("click", () => {
    manager.nextInstance();
    updateIndicator();
  });

  document.getElementById("left")?.addEventListener("click", () => {
    manager.prevInstance();
    updateIndicator();
  });
}
