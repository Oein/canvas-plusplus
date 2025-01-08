export default function setProgress(props: {
  title: string;
  desc: string;
  progress: number;
}) {
  const l = document.querySelector("#loading") as HTMLDivElement;
  if (l) {
    l.style.display = "flex";
  }

  const t = document.querySelector("#progress-title");
  const d = document.querySelector("#progress-desc");
  const p = document.querySelector("#progress-bar") as HTMLDivElement;

  if (t) {
    t.innerHTML = props.title;
  }

  if (d) {
    d.innerHTML = props.desc;
  }

  if (p) {
    p.style.width = `${props.progress}%`;
  }
}

export function hideProgress() {
  const p = document.querySelector("#loading") as HTMLDivElement;
  if (p) {
    p.style.display = "none";
  }
}

(() => {
  const p = document.querySelector("#loading") as HTMLDivElement;
  if (p) {
    p.style.display = "none";
  }
})();
