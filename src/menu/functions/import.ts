import { registerFunction } from "..";
import { manager } from "../../main";

import { decode } from "cbor-x";

registerFunction("import", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".drawing";

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    // array buffer to unit8array
    const unit8Array = new Uint8Array(data);

    const pages = decode(unit8Array);

    manager.clear();

    for (const page of pages) {
      const id = manager.createInstance();
      await manager.instances[id].importFromJSON(page);
    }

    manager.focusInstance(0);
    setTimeout(() => {
      document.getElementById("left")?.click();
    }, 3);
  });

  input.click();
});
