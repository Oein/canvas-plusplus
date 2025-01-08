import { registerTool } from "..";
import { manager } from "../../main";
import createCanvas from "../../utils/createCanvas";
import getFillColor, { need2fill } from "../../utils/getFillColor";
import {
  addDownListener,
  addMoveListener,
  addUpListener,
} from "../../utils/listener";
import { getState, isShift } from "../../utils/state";
import type { Tool } from "./type";

class TriTool implements Tool {
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
      inst.ctx.fillStyle = getFillColor();
    });

    const d2 = addMoveListener(document, (pos) => {
      if (!isDrawing) return;
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);

      let width = pos.x - startPos.x;
      let height = pos.y - startPos.y;

      if (isShift()) {
        // 정삼각형
        let min = Math.min(Math.abs(width), Math.abs(height));
        if (getState("FIT2MAX"))
          min = Math.max(Math.abs(width), Math.abs(height));
        width = (width > 0 ? 1 : -1) * min;
        height = ((height > 0 ? 1 : -1) * min * Math.sqrt(3)) / 2;
      }

      let sty = startPos.y;
      if (height > 0) {
        height = -height;
        sty -= height;
      }

      inst.ctx.beginPath();
      inst.ctx.moveTo(startPos.x, sty);
      inst.ctx.lineTo(startPos.x + width, sty);
      inst.ctx.lineTo(startPos.x + width / 2, sty + height);
      inst.ctx.closePath();
      inst.ctx.stroke();

      if (need2fill()) inst.ctx.fill();
    });

    const d3 = addUpListener(document, (pos) => {
      if (!isDrawing) return;
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);

      isDrawing = false;

      let width = pos.x - startPos.x;
      let height = pos.y - startPos.y;

      if (isShift()) {
        // 정삼각형
        let min = Math.min(Math.abs(width), Math.abs(height));
        if (getState("FIT2MAX"))
          min = Math.max(Math.abs(width), Math.abs(height));
        width = (width > 0 ? 1 : -1) * min;
        height = ((height > 0 ? 1 : -1) * min * Math.sqrt(3)) / 2;
      }

      let stX = startPos.x;
      let stY = startPos.y;

      if (width < 0) {
        stX += width;
        width = -width;
      }
      if (height < 0) {
        stY += height;
        height = -height;
      }

      manager.focused.appendTriangle({
        x1: stX,
        y1: stY + height,
        x2: stX + width,
        y2: stY + height,
        x3: stX + width / 2,
        y3: stY,
        fillColor: getFillColor(),
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

registerTool("TRI", new TriTool());
