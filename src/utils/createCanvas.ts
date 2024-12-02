export default function createCanvas() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const resizeHandler = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  window.addEventListener("resize", resizeHandler);

  return {
    canvas,
    ctx,
    destroy: () => window.removeEventListener("resize", resizeHandler),
  };
}
