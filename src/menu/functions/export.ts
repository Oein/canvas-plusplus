import { registerFunction } from "..";
import { manager } from "../../main";

import { encode } from "cbor-x";
import { getState } from "../../utils/state";

registerFunction("export", async () => {
  const result = await Promise.all(
    manager.instances.map((instance) => instance.exportAsJSON())
  );

  console.log(result);

  const a = document.createElement("a");
  const file = new Blob([encode(result)], { type: "application/json" });
  a.href = URL.createObjectURL(file);
  a.download = "canvas" + getState("SAVE_EXTENSION");
  a.click();
});
