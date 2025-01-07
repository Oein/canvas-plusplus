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

class ElipTool implements Tool {
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

      let radiusX = Math.abs(width / 2);
      let radiusY = Math.abs(height / 2);

      if (isShift()) {
        let min = Math.min(radiusX, radiusY);
        if (getState("FIT2MAX")) min = Math.max(radiusX, radiusY);
        radiusX = min;
        radiusY = min;
      }

      const xCenter = startPos.x + (width > 0 ? radiusX : -radiusX);
      const yCenter = startPos.y + (height > 0 ? radiusY : -radiusY);

      inst.ctx.beginPath();
      inst.ctx.ellipse(xCenter, yCenter, radiusX, radiusY, 0, 0, 2 * Math.PI);
      inst.ctx.stroke();
    });

    const d3 = addUpListener(document, (pos) => {
      if (!isDrawing) return;
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);
      isDrawing = false;

      let width = pos.x - startPos.x;
      let height = pos.y - startPos.y;

      let radiusX = Math.abs(width / 2);
      let radiusY = Math.abs(height / 2);

      if (isShift()) {
        let min = Math.min(radiusX, radiusY);
        if (getState("FIT2MAX")) min = Math.max(radiusX, radiusY);
        radiusX = min;
        radiusY = min;
      }

      const xCenter = startPos.x + (width > 0 ? radiusX : -radiusX);
      const yCenter = startPos.y + (height > 0 ? radiusY : -radiusY);

      manager.focused.appendCircle({
        x: xCenter,
        y: yCenter,
        xRadius: radiusX,
        yRadius: radiusY,
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

registerTool("ELIP", new ElipTool());
