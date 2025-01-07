import { registerTool } from "..";
import { manager } from "../../main";
import createCanvas from "../../utils/createCanvas";
import {
  addDownListener,
  addMoveListener,
  addUpListener,
} from "../../utils/listener";
import { getState, isShift } from "../../utils/state";
import type { Tool } from "./type";

class RectTool implements Tool {
  toolsArea: HTMLDivElement;
  constructor() {
    this.toolsArea = document.getElementById("toolsArea") as HTMLDivElement;
  }
  apply() {
    const inst = createCanvas();
    this.toolsArea.appendChild(inst.canvas);

    inst.canvas.style.cursor = "crosshair";

    let isDrawing = false;
    let startPos = { x: 0, y: 0 };

    const d1 = addDownListener(inst.canvas, (pos) => {
      isDrawing = true;
      startPos = pos;

      inst.ctx.strokeStyle = getState("COLOR");
      inst.ctx.lineWidth = getState("STROKE");
    });

    const d2 = addMoveListener(document, (pos) => {
      if (!isDrawing) return;
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);
      let width = pos.x - startPos.x;
      let height = pos.y - startPos.y;

      if (isShift()) {
        const absWidth = Math.abs(width);
        const absHeight = Math.abs(height);
        let min = Math.min(absWidth, absHeight);
        if (getState("FIT2MAX")) min = Math.max(absWidth, absHeight);
        width = width < 0 ? -min : min;
        height = height < 0 ? -min : min;
      }

      inst.ctx.strokeRect(startPos.x, startPos.y, width, height);
    });

    const d3 = addUpListener(document, (pos) => {
      if (!isDrawing) return;
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);

      isDrawing = false;

      let x = startPos.x;
      let y = startPos.y;
      let width = pos.x - startPos.x;
      let height = pos.y - startPos.y;

      if (isShift()) {
        const absWidth = Math.abs(width);
        const absHeight = Math.abs(height);
        let min = Math.min(absWidth, absHeight);
        if (getState("FIT2MAX")) min = Math.max(absWidth, absHeight);
        width = width < 0 ? -min : min;
        height = height < 0 ? -min : min;
      }

      if (width < 0) {
        x = pos.x;
        width = -width;
      }
      if (height < 0) {
        y = pos.y;
        height = -height;
      }

      manager.focused.appendRectangle({
        x,
        y,
        width,
        height,
        fillColor: "transparent",
        strokeColor: getState("COLOR"),
        strokeWidth: getState("STROKE"),
      });
      manager.focused.requestRender();
      manager.focused.saveAsHistory();
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

registerTool("RECT", new RectTool());
