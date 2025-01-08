import { registerFunction } from "..";
import { manager } from "../../main";

import { encode } from "cbor-x";
import { getState } from "../../utils/state";
import setProgress, { hideProgress } from "../../utils/progress";

registerFunction("export", async () => {
  let handled = 0;
  setProgress({
    title: "Exporting",
    desc: `Generating pages (1/${manager.instances.length})`,
    progress: 0,
  });
  const result = await Promise.all(
    manager.instances.map(async (instance) => {
      try {
        const dt = await instance.exportAsJSON();
        handled++;
        setProgress({
          title: "Exporting",
          desc: `Generating pages (${handled}/${manager.instances.length})`,
          progress: (handled / manager.instances.length) * 100,
        });
        return dt;
      } catch (e) {
        console.error(e);
        setProgress({
          title: "Exporting",
          desc: "Failed - Error",
          progress: 100,
        });
      }
    })
  ).catch((e) => {
    console.error(e);
    setProgress({
      title: "Exporting",
      desc: "Failed - Error",
      progress: 100,
    });
    return null;
  });

  const a = document.createElement("a");
  const file = new Blob([encode(result)], { type: "application/json" });

  setProgress({
    title: "Exporting",
    desc: "Exported",
    progress: 100,
  });

  a.href = URL.createObjectURL(file);
  a.download = "canvas" + getState("SAVE_EXTENSION");
  a.click();

  setTimeout(() => {
    hideProgress();
  }, 100);
});
