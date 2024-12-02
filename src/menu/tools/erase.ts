import { registerTool } from "..";
import { manager } from "../../main";
import createCanvas from "../../utils/createCanvas";
import {
  addDownListener,
  addMoveListener,
  addUpListener,
} from "../../utils/listener";
import { getState } from "../../utils/state";
import type { Tool } from "./type";

class EraseTool implements Tool {
  toolsArea: HTMLDivElement;
  constructor() {
    this.toolsArea = document.getElementById("toolsArea") as HTMLDivElement;
  }
  apply() {
    const inst = createCanvas();
    this.toolsArea.appendChild(inst.canvas);

    inst.canvas.style.cursor = "crosshair";

    let isDrawing = false;
    let lastApplied = { x: 0, y: 0 };

    const d1 = addDownListener(inst.canvas, (pos) => {
      isDrawing = true;
      lastApplied = pos;

      const rmved = manager.focused.removeAt(pos);
      if (rmved.length) {
        manager.focused.requestRender();
        manager.focused.saveAsHistory();
      }
    });

    const d2 = addMoveListener(document, (pos) => {
      if (!isDrawing) return;
      const dist = Math.hypot(lastApplied.x - pos.x, lastApplied.y - pos.y);
      if (dist < getState("PEN_MIN_DIST")) return;
      lastApplied = pos;
      const rmved = manager.focused.removeAt(pos);
      if (rmved.length) {
        manager.focused.requestRender();
        manager.focused.saveAsHistory();
        console.log("saveAsHistory");
      }
    });

    const d3 = addUpListener(document, (pos) => {
      if (!isDrawing) return;
      isDrawing = false;

      const rmved = manager.focused.removeAt(pos);
      if (rmved.length) {
        manager.focused.requestRender();
        manager.focused.saveAsHistory();
        console.log("saveAsHistory");
      }
    });

    return () => {
      this.toolsArea.removeChild(inst.canvas);
      inst.destroy();

      d1();
      d2();
      d3();
    };
  }
}

registerTool("ERASE", new EraseTool());
