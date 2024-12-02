import { setState } from "../utils/state";

export default function setupColor() {
  let focusedColor = 0;
  const clwrp = document.querySelectorAll(".colorwrp");
  clwrp.forEach((e, i) => {
    (e.children[0] as HTMLDivElement).style.background = (
      e.children[1] as HTMLInputElement
    ).value;

    e.addEventListener("click", () => {
      if (focusedColor == i) {
        (e.children[1] as HTMLInputElement).click();
      } else clwrp[focusedColor].classList.remove("focus");
      focusedColor = i;
      e.classList.add("focus");
      setState("COLOR", (e.children[1] as HTMLInputElement).value);
    });
    e.children[1].addEventListener("input", () => {
      (e.children[0] as HTMLDivElement).style.background = (
        e.children[1] as HTMLInputElement
      ).value;
      setState("COLOR", (e.children[1] as HTMLInputElement).value);
    });
  });
}
