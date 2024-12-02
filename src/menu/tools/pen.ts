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

class PenTool implements Tool {
  toolsArea: HTMLDivElement;
  constructor() {
    this.toolsArea = document.getElementById("toolsArea") as HTMLDivElement;
  }
  apply() {
    const inst = createCanvas();
    this.toolsArea.appendChild(inst.canvas);

    inst.canvas.style.cursor = "crosshair";

    let isDrawing = false;
    let points: { x: number; y: number }[] = [];

    const d1 = addDownListener(inst.canvas, (pos) => {
      isDrawing = true;
      points = [pos];

      inst.ctx.strokeStyle = getState("COLOR");
      inst.ctx.lineWidth = getState("STROKE");
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);

      inst.ctx.beginPath();
      inst.ctx.moveTo(pos.x, pos.y);
    });

    const d2 = addMoveListener(document, (pos) => {
      if (!isDrawing) return;
      const MIN_DIST = getState("PEN_MIN_DIST") as number;
      const last = points[points.length - 1];
      const dist = Math.hypot(last.x - pos.x, last.y - pos.y);
      if (dist < MIN_DIST) return;
      inst.ctx.lineTo(pos.x, pos.y);
      inst.ctx.stroke();
      points.push(pos);
    });

    const d3 = addUpListener(document, (pos) => {
      if (!isDrawing) return;
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);

      isDrawing = false;
      points.push(pos);
      manager.focused.appendPenPath({
        points,
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

registerTool("PEN", new PenTool());
