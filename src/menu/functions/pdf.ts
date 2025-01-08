import { registerFunction } from "..";
import { manager } from "../../main";

import jsPDF from "jspdf";
import setProgress, { hideProgress } from "../../utils/progress";

registerFunction("pdf", async () => {
  let handled = 0;
  setProgress({
    title: "Exporting PDF",
    desc: `Generating pages (1/${manager.instances.length})`,
    progress: 0,
  });
  const promises = await Promise.all(
    manager.instances.map(async (instance) => {
      const pdf = await instance.exportAsImage();
      handled++;
      setProgress({
        title: "Exporting PDF",
        desc: `Generating pages (${handled}/${manager.instances.length})`,
        progress: (handled / manager.instances.length) * 100,
      });
      return pdf;
    })
  );

  const doc = new jsPDF({
    unit: "px",
    format: [window.innerWidth, window.innerHeight],
    orientation: window.innerWidth > window.innerHeight ? "l" : "p",
  });

  setProgress({
    title: "Exporting PDF",
    desc: `Adding pages to PDF (0/${promises.length})`,
    progress: 0,
  });

  promises.forEach((img, i) => {
    if (i !== 0) {
      doc.addPage([window.innerWidth, window.innerHeight]);
    }
    doc.addImage(img, "WEBP", 0, 0, window.innerWidth, window.innerHeight);

    setProgress({
      title: "Exporting PDF",
      desc: `Adding pages to PDF (${i + 1}/${promises.length})`,
      progress: ((i + 1) / promises.length) * 100,
    });
  });

  setProgress({
    title: "Exporting PDF",
    desc: "Saving PDF",
    progress: 100,
  });

  doc.save(`canvas ${new Date().toString()}.pdf`);

  hideProgress();
});
