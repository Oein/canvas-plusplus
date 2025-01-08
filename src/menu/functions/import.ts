import { registerFunction } from "..";
import { manager } from "../../main";

import { decode } from "cbor-x";
import { getState } from "../../utils/state";
import { updateIndicator } from "../page";
import setProgress, { hideProgress } from "../../utils/progress";

registerFunction("import", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = getState("SAVE_EXTENSION");

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    setProgress({
      title: "Importing",
      desc: "Reading file",
      progress: 0,
    });

    const data = await file.arrayBuffer();
    // array buffer to unit8array
    const unit8Array = new Uint8Array(data);

    setProgress({
      title: "Importing",
      desc: "Decoding",
      progress: 50,
    });

    const pages = decode(unit8Array);

    manager.clear();

    setProgress({
      title: "Importing",
      desc: `Importing pages (0/${pages.length})`,
      progress: 0,
    });

    let handled = 0;

    let i = 0;
    for (const page of pages) {
      i++;
      const id = manager.createInstance();
      try {
        await manager.instances[id].importFromJSON(page);
      } catch (e) {
        console.error(e);
        setProgress({
          title: "Importing",
          desc: `Failed - Error while importing page ${i}`,
          progress: 100,
        });
        return;
      }

      handled++;
      setProgress({
        title: "Importing",
        desc: `Importing pages (${handled}/${pages.length})`,
        progress: (handled / pages.length) * 100,
      });
    }

    manager.focusInstance(0);
    setTimeout(() => {
      document.getElementById("left")?.click();
      updateIndicator();
      hideProgress();
    }, 3);
  });

  input.click();
});
