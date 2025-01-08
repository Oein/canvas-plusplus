import { getState } from "./state";

export default function renderTextToImageWebPPrecise(text: string): string {
  // Create a canvas and context
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to get canvas context");
  }

  // Define font and line height
  const fontSize = 48 * getState("TEXT_RES");
  const lineHeight = fontSize * 1.4; // Adjust line height as needed
  context.font = `${fontSize}px Arial`;
  context.fillStyle = getState("COLOR");

  // Split the text into lines based on \n
  const lines = text.split("\n");

  // Measure the width of the longest line
  let maxWidth = Math.max(
    ...lines.map((line) => context.measureText(line).width)
  );

  let scale = 1;

  while (maxWidth >= 16384) {
    maxWidth /= 2;
    scale /= 2;
  }

  // Temporarily set canvas dimensions to render the text
  canvas.width = Math.ceil(maxWidth); // Add horizontal padding
  canvas.height = Math.ceil(
    (lines.length * lineHeight - (lineHeight - fontSize)) * scale
  ); // Approximate height

  // Redefine font after resizing canvas
  context.font = `${fontSize * scale}px Arial`;
  context.textBaseline = "top";

  // Render the text
  context.fillStyle = getState("COLOR");
  lines.forEach((line, index) => {
    const y = index * lineHeight * scale; // Vertical position per line
    context.fillText(line, 0, y);
  });

  // Create an HTMLImageElement from the canvas
  return canvas.toDataURL("image/webp");
}
