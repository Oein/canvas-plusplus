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

export class LineTool implements Tool {
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

    const get_snapXY = (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      deg: number
    ) => {
      let xmove, ymove, minMove, xneg, yneg;
      switch (deg) {
        case 0:
          return { x: endX, y: startY };
        case 45:
          xmove = endX - startX;
          ymove = endY - startY;
          minMove = Math.abs(Math.min(xmove, ymove));
          if (getState("FIT2MAX")) minMove = Math.abs(Math.max(xmove, ymove));
          xneg = xmove < 0 ? -1 : 1;
          yneg = ymove < 0 ? -1 : 1;
          return { x: startX + minMove * xneg, y: startY + minMove * yneg };
        case 90:
          return { x: startX, y: endY };
        case 135:
          xmove = endX - startX;
          ymove = endY - startY;
          minMove = Math.abs(Math.min(xmove, ymove));
          if (getState("FIT2MAX")) minMove = Math.abs(Math.max(xmove, ymove));
          xneg = xmove < 0 ? -1 : 1;
          yneg = ymove < 0 ? -1 : 1;
          return { x: startX + minMove * xneg, y: startY + minMove * yneg };
        case 180:
          return { x: endX, y: startY };
        case -45:
          xmove = endX - startX;
          ymove = endY - startY;
          minMove = Math.abs(Math.min(xmove, ymove));
          if (getState("FIT2MAX")) minMove = Math.abs(Math.max(xmove, ymove));
          xneg = xmove < 0 ? -1 : 1;
          yneg = ymove < 0 ? -1 : 1;
          return { x: startX + minMove * xneg, y: startY + minMove * yneg };
        case -90:
          return { x: startX, y: endY };
        case -135:
          xmove = endX - startX;
          ymove = endY - startY;
          minMove = Math.abs(Math.min(xmove, ymove));
          if (getState("FIT2MAX")) minMove = Math.abs(Math.max(xmove, ymove));
          xneg = xmove < 0 ? -1 : 1;
          yneg = ymove < 0 ? -1 : 1;
          return { x: startX + minMove * xneg, y: startY + minMove * yneg };
        case -180:
          return { x: endX, y: startY };
      }

      return { x: endX, y: endY };
    };

    const d1 = addDownListener(inst.canvas, (pos) => {
      isDrawing = true;
      startPos = pos;

      inst.ctx.strokeStyle = getState("COLOR");
      inst.ctx.lineWidth = getState("STROKE");
      inst.ctx.setLineDash(getState("DASHLINE"));
    });

    const d2 = addMoveListener(document, (pos) => {
      if (!isDrawing) return;
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);

      let { x, y } = pos;

      // get line drgree from x axis
      const rad = Math.atan2(y - startPos.y, x - startPos.x);
      // rad to degree
      let deg = rad * (180 / Math.PI);

      if (getState("SNAP_RIGHT")) {
        // snap by 45 degree
        for (let i = 0; i < 360 / 45; i++) {
          let deg45 = i * 45;
          if (deg45 > 180) deg45 -= 360;
          if (
            deg <= deg45 + getState("SNAP_DEG") &&
            deg >= deg45 - getState("SNAP_DEG")
          ) {
            deg = deg45;
            break;
          }
        }
      }

      if (isShift()) {
        // get most close 45 degree
        const deg45 = Math.round(deg / 45) * 45;
        deg = deg45;
      }

      const snapped = get_snapXY(startPos.x, startPos.y, x, y, deg);
      x = snapped.x;
      y = snapped.y;

      inst.ctx.beginPath();
      inst.ctx.moveTo(startPos.x, startPos.y);
      inst.ctx.lineTo(x, y);
      inst.ctx.stroke();
    });

    const d3 = addUpListener(document, (pos) => {
      if (!isDrawing) return;
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);
      isDrawing = false;

      let { x, y } = pos;

      // get line drgree from x axis
      const rad = Math.atan2(y - startPos.y, x - startPos.x);
      // rad to degree
      let deg = rad * (180 / Math.PI);

      if (getState("SNAP_RIGHT")) {
        // snap by 45 degree
        for (let i = 0; i < 360 / 45; i++) {
          let deg45 = i * 45;
          if (deg45 > 180) deg45 -= 360;
          if (
            deg <= deg45 + getState("SNAP_DEG") &&
            deg >= deg45 - getState("SNAP_DEG")
          ) {
            deg = deg45;
            break;
          }
        }
      }

      if (isShift()) {
        // get most close 45 degree
        const deg45 = Math.round(deg / 45) * 45;
        deg = deg45;
      }

      const snapped = get_snapXY(startPos.x, startPos.y, x, y, deg);
      x = snapped.x;
      y = snapped.y;

      manager.focused.appendLine({
        x1: startPos.x,
        y1: startPos.y,
        x2: x,
        y2: y,
        strokeColor: getState("COLOR"),
        strokeWidth: getState("STROKE"),
        dashArray: getState("DASHLINE"),
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

registerTool("LINE", new LineTool());
