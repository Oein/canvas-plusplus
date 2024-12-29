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
    let isErasing = false;
    let lastApplied = { x: 0, y: 0 };
    let points: { x: number; y: number }[] = [];

    const disableContext = (ev: MouseEvent) => {
      if (getState("RCLICK2ERASE")) ev.preventDefault();
    };
    inst.canvas.addEventListener("contextmenu", disableContext);
    const d1 = addDownListener(inst.canvas, (pos, ev) => {
      isDrawing = true;
      if (
        ev.pointerType == "mouse" &&
        ev.button == 2 &&
        getState("RCLICK2ERASE")
      ) {
        ev.preventDefault();
        isErasing = true;
        lastApplied = pos;

        const rmved = manager.focused.removeAt(pos);
        if (rmved.length) {
          manager.focused.requestRender();
          manager.focused.saveAsHistory();
        }
        return;
      }
      points = [pos];

      inst.ctx.strokeStyle = getState("COLOR");
      inst.ctx.lineWidth = getState("STROKE");
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);

      inst.ctx.beginPath();
      inst.ctx.moveTo(pos.x, pos.y);
    });

    const d2 = addMoveListener(document, (pos, ev) => {
      if (!isDrawing) return;

      if (isErasing) {
        ev.preventDefault();
        const dist = Math.hypot(lastApplied.x - pos.x, lastApplied.y - pos.y);
        if (dist < 1) return;
        lastApplied = pos;
        const rmved = manager.focused.removeAt(pos);
        if (rmved.length) {
          manager.focused.requestRender();
          manager.focused.saveAsHistory();
          console.log("saveAsHistory");
        }
        return;
      }

      const MIN_DIST = getState("PEN_MIN_DIST") as number;
      const last = points[points.length - 1];
      const dist = Math.hypot(last.x - pos.x, last.y - pos.y);
      if (dist < MIN_DIST) return;
      inst.ctx.lineTo(pos.x, pos.y);
      inst.ctx.stroke();
      points.push(pos);
    });

    const d3 = addUpListener(document, (pos, ev) => {
      if (!isDrawing) return;
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);

      isDrawing = false;

      if (isErasing) {
        ev.preventDefault();
        const rmved = manager.focused.removeAt(pos);
        if (rmved.length) {
          manager.focused.requestRender();
          manager.focused.saveAsHistory();
          console.log("saveAsHistory");
        }
        isErasing = false;
        return;
      }

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
      inst.canvas.removeEventListener("contextmenu", disableContext);
    };
  }
}

registerTool("PEN", new PenTool());
