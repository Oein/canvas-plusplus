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
        if (deg <= getState("SNAP_DEG") && deg >= -getState("SNAP_DEG")) {
          y = startPos.y;
          deg = 0;
        }
        if (
          deg >= 90 - getState("SNAP_DEG") &&
          deg <= 90 + getState("SNAP_DEG")
        ) {
          x = startPos.x;
          deg = 90;
        }
        if (
          deg >= 180 - getState("SNAP_DEG") ||
          deg <= -180 + getState("SNAP_DEG")
        ) {
          y = startPos.y;
          deg = 180;
        }
        if (
          deg >= -90 - getState("SNAP_DEG") &&
          deg <= -90 + getState("SNAP_DEG")
        ) {
          x = startPos.x;
          deg = -90;
        }
      }

      if (isShift()) {
        const dx = Math.abs(x - startPos.x);
        const dy = Math.abs(y - startPos.x);
        if (dx > dy) {
          y = startPos.y;
          deg = startPos.x < x ? 0 : 180;
        } else {
          x = startPos.x;
          deg = startPos.y < y ? 90 : -90;
        }
      }

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
        if (deg <= getState("SNAP_DEG") && deg >= -getState("SNAP_DEG")) {
          y = startPos.y;
          deg = 0;
        }
        if (
          deg >= 90 - getState("SNAP_DEG") &&
          deg <= 90 + getState("SNAP_DEG")
        ) {
          x = startPos.x;
          deg = 90;
        }
        if (
          deg >= 180 - getState("SNAP_DEG") ||
          deg <= -180 + getState("SNAP_DEG")
        ) {
          y = startPos.y;
          deg = 180;
        }
        if (
          deg >= -90 - getState("SNAP_DEG") &&
          deg <= -90 + getState("SNAP_DEG")
        ) {
          x = startPos.x;
          deg = -90;
        }
      }

      if (isShift()) {
        const dx = Math.abs(x - startPos.x);
        const dy = Math.abs(y - startPos.x);
        if (dx > dy) {
          y = startPos.y;
          deg = startPos.x < x ? 0 : 180;
        } else {
          x = startPos.x;
          deg = startPos.y < y ? 90 : -90;
        }
      }

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
