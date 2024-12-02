import { registerFunction } from "..";
import { manager } from "../../main";

import jsPDF from "jspdf";

registerFunction("pdf", async () => {
  const promises = await Promise.all(
    manager.instances.map(async (instance) => {
      const pdf = await instance.exportAsImage();
      return pdf;
    })
  );

  const doc = new jsPDF({
    unit: "px",
    format: [window.innerWidth, window.innerHeight],
    orientation: window.innerWidth > window.innerHeight ? "l" : "p",
  });

  promises.forEach((img, i) => {
    if (i !== 0) {
      doc.addPage([window.innerWidth, window.innerHeight]);
    }
    doc.addImage(img, "PNG", 0, 0, window.innerWidth, window.innerHeight);
  });

  doc.save("canvas.pdf");
});
