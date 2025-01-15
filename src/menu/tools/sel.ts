import { registerTool } from "..";
import { manager } from "../../main";
import CoordinateInputModal from "../../modal/xyInputModal";
import createCanvas from "../../utils/createCanvas";
import hslColor from "../../utils/hslColor";
import {
  addDownListener,
  addMoveListener,
  addUpListener,
} from "../../utils/listener";
import { getState, isShift } from "../../utils/state";
import type { Tool } from "./type";
import { encode } from "cbor-x";

const ua = navigator.userAgent.toLowerCase();
const isMac =
  ua.indexOf("mac") > -1 &&
  ua.indexOf("os") > -1 &&
  !(
    ua.indexOf("iphone") > -1 ||
    ua.indexOf("ipad") > -1 ||
    ua.indexOf("windows") > -1
  );

export class SelTool implements Tool {
  toolsArea: HTMLDivElement;
  constructor() {
    this.toolsArea = document.getElementById("toolsArea") as HTMLDivElement;
  }

  bboxElem!: HTMLDivElement;
  bboxScaleElem!: HTMLDivElement;
  bboxRotateElem!: HTMLDivElement;
  selectedObjects: number[] = [];

  instCanvas!: HTMLCanvasElement;

  state: "IDLE" | "SELECTED" | "MOVING" | "SCALE" | "ROTATE" = "IDLE";

  bboxListenDestroiers: (() => void)[] = [];

  nextBBoxColor: string | null = null;

  createBBox() {
    this.bboxElem = document.createElement("div");
    this.bboxElem.style.position = "fixed";
    this.bboxElem.style.border = "1px dashed " + hslColor(1);
    this.bboxElem.style.background = this.nextBBoxColor || hslColor(0.3);
    this.bboxElem.style.zIndex = "15";

    this.nextBBoxColor = null;

    const allPoly = this.selectedObjects.map(
      (id) => manager.focused.cachecdPolygon[id]
    );

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const poly of allPoly) {
      for (const point of poly) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }

    this.bboxElem.style.left = minX + "px";
    this.bboxElem.style.top = minY + "px";
    this.bboxElem.style.width = maxX - minX + "px";
    this.bboxElem.style.height = maxY - minY + "px";
    this.bboxElem.style.cursor = "move";

    this.toolsArea.appendChild(this.bboxElem);
  }
  listenBBoxMove() {
    let startPos = { x: 0, y: 0 };
    let movedWithShift = -1;
    let moveMultiplier = 1;
    const a = addDownListener(this.bboxElem, (pos, e) => {
      if (this.state !== "SELECTED") return;
      console.groupCollapsed("[Move ☩]");
      e.stopPropagation();
      e.preventDefault();

      this.state = "MOVING";
      startPos = pos;

      this.instCanvas.style.cursor = "move";
      moveMultiplier = 1;
      movedWithShift = -1;
    });
    const b = addMoveListener(this.toolsArea, (pos, e) => {
      if (this.state !== "MOVING") return;
      if (movedWithShift === -1) {
        movedWithShift = isShift() ? 1 : 0;
      }
      if (movedWithShift) moveMultiplier = getState("LITTLE_MOVE_MULTIPLIER");
      e.stopPropagation();
      e.preventDefault();

      let dx = pos.x - startPos.x;
      let dy = pos.y - startPos.y;

      dx *= moveMultiplier;
      dy *= moveMultiplier;

      startPos = pos;
      for (const id of this.selectedObjects) {
        manager.focused.transform(id, dx, dy);
      }
      manager.focused.requestRender();

      // update bbox left, top
      const left = parseFloat(this.bboxElem.style.left);
      const top = parseFloat(this.bboxElem.style.top);
      this.bboxElem.style.left = left + dx + "px";
      this.bboxElem.style.top = top + dy + "px";
    });
    const c = addUpListener(this.toolsArea, (_pos, e) => {
      if (this.state !== "MOVING") return;
      e.stopPropagation();
      e.preventDefault();

      this.state = "SELECTED";
      console.groupCollapsed("[Move / save polygon ⭓]");
      for (const id of this.selectedObjects) {
        manager.focused.cachePolygon(id);
      }
      console.groupEnd();

      this.instCanvas.style.cursor = "crosshair";
      manager.focused.saveAsHistory();

      console.groupEnd();
    });

    this.bboxListenDestroiers.push(a);
    this.bboxListenDestroiers.push(b);
    this.bboxListenDestroiers.push(c);
  }
  destroyBBox() {
    if (this.bboxElem) {
      this.bboxElem.remove();
    }

    for (const destory of this.bboxListenDestroiers) {
      destory();
    }
    this.bboxListenDestroiers = [];
  }

  createBBoxScale() {
    this.bboxScaleElem = document.createElement("div");
    this.bboxScaleElem.style.position = "absolute";
    this.bboxScaleElem.style.zIndex = "15";
    this.bboxScaleElem.style.width = "10px";
    this.bboxScaleElem.style.height = "10px";
    this.bboxScaleElem.style.background = "#fff";
    this.bboxScaleElem.style.border = "1px solid #000";
    this.bboxScaleElem.style.cursor = "nwse-resize";

    this.bboxScaleElem.style.right = "-5px";
    this.bboxScaleElem.style.bottom = "-5px";

    this.bboxElem.appendChild(this.bboxScaleElem);
  }
  listenBBoxScale() {
    let startPos = { x: 0, y: 0 };
    let initialPos = { x: 0, y: 0 };
    let initialBBoxWidth = 0;
    let initialBBoxHeight = 0;
    let bboxWidth = 0;
    let bboxHeight = 0;
    const a = addDownListener(this.bboxScaleElem, (pos, e) => {
      if (this.state !== "SELECTED") return;
      console.groupCollapsed("[Scale 🔍]");
      e.stopPropagation();
      e.preventDefault();

      this.state = "SCALE";
      startPos = pos;
      initialPos = { ...pos };

      bboxWidth = parseFloat(this.bboxElem.style.width);
      bboxHeight = parseFloat(this.bboxElem.style.height);

      initialBBoxWidth = bboxWidth + 0;
      initialBBoxHeight = bboxHeight + 0;

      this.instCanvas.style.cursor = "nwse-resize";
    });
    const b = addMoveListener(this.toolsArea, (pos, e) => {
      if (this.state !== "SCALE") return;
      e.stopPropagation();
      e.preventDefault();

      let dx = pos.x - startPos.x;
      let dy = pos.y - startPos.y;

      let newWidth = bboxWidth + dx;
      let newHeight = bboxHeight + dy;

      let newXScale = newWidth / bboxWidth;
      let newYScale = newHeight / bboxHeight;

      if (isShift()) {
        // fit to min
        let ddx = pos.x - initialPos.x;
        let ddy = pos.y - initialPos.y;

        let dwith = initialBBoxWidth + ddx;
        let dheight = initialBBoxHeight + ddy;

        let dscaleX = dwith / initialBBoxWidth;
        let dscaleY = dheight / initialBBoxHeight;

        let minScale = Math.min(dscaleX, dscaleY);

        newWidth = initialBBoxWidth * minScale;
        newHeight = initialBBoxHeight * minScale;

        newXScale = newWidth / bboxWidth;
        newYScale = newHeight / bboxHeight;
      }

      bboxWidth = newWidth;
      bboxHeight = newHeight;

      this.bboxElem.style.width = newWidth + "px";
      this.bboxElem.style.height = newHeight + "px";

      startPos = pos;

      for (const id of this.selectedObjects) {
        manager.focused.scaleAboutRect(
          id,
          {
            x: parseFloat(this.bboxElem.style.left),
            y: parseFloat(this.bboxElem.style.top),
            width: bboxWidth,
            height: bboxHeight,
          },
          newXScale,
          newYScale
        );
      }

      manager.focused.requestRender();
    });
    const c = addUpListener(this.toolsArea, (_pos, e) => {
      if (this.state !== "SCALE") return;
      e.stopPropagation();
      e.preventDefault();

      this.state = "SELECTED";

      for (const id of this.selectedObjects) {
        manager.focused.cachePolygon(id);
      }

      this.instCanvas.style.cursor = "crosshair";
      manager.focused.saveAsHistory();

      console.groupEnd();
    });

    this.bboxListenDestroiers.push(a);
    this.bboxListenDestroiers.push(b);
    this.bboxListenDestroiers.push(c);
  }

  setupBBoxToolButton(
    type:
      | "REMOVE"
      | "TRANSFORM"
      | "FLIPX"
      | "FLIPY"
      | "COPY"
      | "COPY2CLIPBOARD",
    el: HTMLElement
  ) {
    el.style.position = "absolute";
    el.style.width = "20px";
    el.style.height = "20px";
    el.style.backgroundColor = "white";
    el.style.color = "black";
    el.style.textAlign = "center";
    el.style.lineHeight = "20px";
    el.style.cursor = "pointer";
    el.style.border = "1px solid black";
    el.style.display = "flex";
    el.style.justifyContent = "center";
    el.style.alignItems = "center";
    el.style.zIndex = "10000000";
    el.style.pointerEvents = "all";

    switch (type) {
      case "REMOVE":
        el.style.left = "-30px";
        el.style.top = "0px";
        break;
      case "TRANSFORM":
        el.style.left = "-30px";
        el.style.top = "20px";
        break;
      case "FLIPX":
        el.style.left = "-30px";
        el.style.top = "40px";
        break;
      case "FLIPY":
        el.style.left = "-30px";
        el.style.top = "60px";
        break;
      case "COPY":
        el.style.right = "-30px";
        el.style.top = "0px";
        break;
      case "COPY2CLIPBOARD":
        el.style.right = "-30px";
        el.style.top = "30px";
        break;
    }
  }

  setupBBoxButtonEventHandler(el: HTMLElement, evHandler: () => any) {
    let meDowned = false;
    addDownListener(el, (_data, e) => {
      e.preventDefault();
      e.stopPropagation();
      meDowned = true;
    });
    addMoveListener(el, (_data, e) => {
      if (!meDowned) return;
      e.preventDefault();
      e.stopPropagation();
    });
    addUpListener(el, (_data, e) => {
      if (!meDowned) return;
      meDowned = false;
      e.preventDefault();
      e.stopPropagation();
    });

    el.addEventListener("pointerup", (e) => {
      e.preventDefault();
      setTimeout(() => evHandler(), 3);
    });
  }

  setupBBoxRemoveButton() {
    const removeButton = document.createElement("div");
    this.setupBBoxToolButton("REMOVE", removeButton);
    this.setupBBoxButtonEventHandler(removeButton, () => {
      console.groupCollapsed("[Remove 🗑️]");
      for (let i = 0; i < this.selectedObjects.length; i++) {
        manager.focused.removeElement(this.selectedObjects[i]);
      }
      manager.focused.requestRender();
      manager.focused.saveAsHistory();

      this.disselect();
      console.groupEnd();
    });

    removeButton.innerHTML = `<svg style="width: 20px; height: 20px;"  xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;

    return removeButton;
  }

  setupBBoxTransformButton() {
    const transformButton = document.createElement("div");
    this.setupBBoxToolButton("TRANSFORM", transformButton);
    const handleSelectBind = this.handleSelect.bind(this);
    this.setupBBoxButtonEventHandler(transformButton, () => {
      const selected = [...this.selectedObjects];
      const modal = new CoordinateInputModal(
        (resu) => {
          if (resu === null) return;
          console.groupCollapsed("[Transform 🔄]");
          for (let i = 0; i < this.selectedObjects.length; i++) {
            manager.focused.transform(this.selectedObjects[i], resu.x, resu.y);
            manager.focused.cachePolygon(this.selectedObjects[i]);
          }
          manager.focused.requestRender();
          manager.focused.saveAsHistory();
          console.groupEnd();

          setTimeout(() => {
            handleSelectBind(selected);
          }, 3);
        },
        "이동",
        "상대적 좌표가 필요합니다"
      );
      modal.open();
    });

    transformButton.innerHTML = `<svg style="width: 20px; height: 20px;" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M440-40v-167l-44 43-56-56 140-140 140 140-56 56-44-43v167h-80ZM220-340l-56-56 43-44H40v-80h167l-43-44 56-56 140 140-140 140Zm520 0L600-480l140-140 56 56-43 44h167v80H753l43 44-56 56Zm-260-80q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420Zm0-180L340-740l56-56 44 43v-167h80v167l44-43 56 56-140 140Z"/></svg>`;

    return transformButton;
  }

  setupBBoxFlipXButton() {
    const flipXButton = document.createElement("div");
    this.setupBBoxToolButton("FLIPX", flipXButton);
    this.setupBBoxButtonEventHandler(flipXButton, () => {
      console.groupCollapsed("[FlipX 🔄]");
      const bbox_X = parseFloat(this.bboxElem.style.left);
      const bbox_W = parseFloat(this.bboxElem.style.width);
      const bbox_CX = bbox_X + bbox_W / 2;

      for (const id of this.selectedObjects) manager.focused.flipX(id, bbox_CX);

      manager.focused.requestRender();
      manager.focused.saveAsHistory();
      console.groupEnd();
    });

    flipXButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentcolor"><path d="M360-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h160v80H200v560h160v80Zm80 80v-880h80v880h-80Zm160-80v-80h80v80h-80Zm0-640v-80h80v80h-80Zm160 640v-80h80q0 33-23.5 56.5T760-120Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80q33 0 56.5 23.5T840-760h-80Z"/></svg>`;

    return flipXButton;
  }

  setupBBoxFlipYButton() {
    const flipYButton = document.createElement("div");
    this.setupBBoxToolButton("FLIPY", flipYButton);
    this.setupBBoxButtonEventHandler(flipYButton, () => {
      console.groupCollapsed("[FlipY 🔄]");
      const bbox_Y = parseFloat(this.bboxElem.style.top);
      const bbox_H = parseFloat(this.bboxElem.style.height);
      const bbox_CY = bbox_Y + bbox_H / 2;

      for (const id of this.selectedObjects) manager.focused.flipY(id, bbox_CY);

      manager.focused.requestRender();
      manager.focused.saveAsHistory();
      console.groupEnd();
    });

    flipYButton.innerHTML = `<svg style="rotate: 90deg;" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentcolor"><path d="M360-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h160v80H200v560h160v80Zm80 80v-880h80v880h-80Zm160-80v-80h80v80h-80Zm0-640v-80h80v80h-80Zm160 640v-80h80q0 33-23.5 56.5T760-120Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80h80v80h-80Zm0-160v-80q33 0 56.5 23.5T840-760h-80Z"/></svg>`;

    return flipYButton;
  }

  setupBBoxCopyButton() {
    const copyButton = document.createElement("div");
    this.setupBBoxToolButton("COPY", copyButton);
    this.setupBBoxButtonEventHandler(copyButton, () => {
      console.groupCollapsed("[Copy 📋]");
      const newSelected: number[] = [];

      for (let i = 0; i < this.selectedObjects.length; i++) {
        const newId = manager.focused.cloneObject(this.selectedObjects[i]);
        newSelected.push(newId);
      }

      manager.focused.requestRender();

      this.disselect();
      setTimeout(() => {
        this.nextBBoxColor = "#575B977F";
        this.handleSelect(newSelected);
        manager.focused.saveAsHistory();
        console.groupEnd();
      }, 3);
    });

    copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentcolor"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>`;

    return copyButton;
  }

  setupBBoxCopy2clipboardButton() {
    const copyButton = document.createElement("div");
    this.setupBBoxToolButton("COPY2CLIPBOARD", copyButton);
    this.setupBBoxButtonEventHandler(copyButton, () => {
      console.groupCollapsed("[Copy2Clipboard 📋]");
      manager.focused.getClipboardData(this.selectedObjects).then((data) => {
        const buf = encode(data) as Uint8Array;
        let res = getState("CLIPBOARD_PREFIX");
        for (let i = 0; i < buf.length; i++) {
          res += String.fromCharCode(buf[i]);
        }

        // copy buf to clipboard
        const type = "text/plain";
        const blob = new Blob([res], { type });

        navigator.clipboard.write([
          new ClipboardItem({
            [type]: blob,
          }),
        ]);
        console.log("Copied to clipboard");
        console.groupEnd();
      });
    });

    copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentcolor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560h-80v120H280v-120h-80v560Zm280-560q17 0 28.5-11.5T520-800q0-17-11.5-28.5T480-840q-17 0-28.5 11.5T440-800q0 17 11.5 28.5T480-760Z"/></svg>`;

    return copyButton;
  }

  createBBoxRotate() {
    this.bboxRotateElem = document.createElement("div");
    this.bboxRotateElem.style.position = "absolute";
    this.bboxRotateElem.style.zIndex = "15";
    this.bboxRotateElem.style.width = "10px";
    this.bboxRotateElem.style.height = "10px";
    this.bboxRotateElem.style.background = "#fff";
    this.bboxRotateElem.style.border = "1px solid #000";
    this.bboxRotateElem.style.cursor = "ew-resize";
    this.bboxRotateElem.style.borderRadius = "50%";

    this.bboxRotateElem.style.left = "50%";
    this.bboxRotateElem.style.top = "-25px";
    this.bboxRotateElem.style.transform = "translateX(-50%)";

    this.bboxElem.appendChild(this.bboxRotateElem);
  }

  listenBBoxRotate() {
    let startPos = { x: 0, y: 0 };
    let initialAngle = 0;
    let lastAppliedAngle = 0;

    const a = addDownListener(this.bboxRotateElem, (pos, e) => {
      if (this.state !== "SELECTED") return;
      console.groupCollapsed("[Rotate 🔄]");
      e.stopPropagation();
      e.preventDefault();

      this.state = "ROTATE";
      startPos = pos;

      const bbox_X = parseFloat(this.bboxElem.style.left);
      const bbox_Y = parseFloat(this.bboxElem.style.top);
      const bbox_W = parseFloat(this.bboxElem.style.width);
      const bbox_H = parseFloat(this.bboxElem.style.height);

      const bbox_CX = bbox_X + bbox_W / 2;
      const bbox_CY = bbox_Y + bbox_H / 2;

      initialAngle = Math.atan2(startPos.y - bbox_CY, startPos.x - bbox_CX);
      lastAppliedAngle = initialAngle + 0;
    });

    const b = addMoveListener(this.toolsArea, (pos, e) => {
      if (this.state !== "ROTATE") return;
      e.stopPropagation();
      e.preventDefault();

      const bbox_X = parseFloat(this.bboxElem.style.left);
      const bbox_Y = parseFloat(this.bboxElem.style.top);
      const bbox_W = parseFloat(this.bboxElem.style.width);
      const bbox_H = parseFloat(this.bboxElem.style.height);

      const bbox_CX = bbox_X + bbox_W / 2;
      const bbox_CY = bbox_Y + bbox_H / 2;

      const angle = Math.atan2(pos.y - bbox_CY, pos.x - bbox_CX);
      const dAngle = angle - lastAppliedAngle;
      lastAppliedAngle = angle + 0;

      for (const id of this.selectedObjects) {
        manager.focused.rotateAbout(id, dAngle, bbox_CX, bbox_CY);
      }

      manager.focused.requestRender();

      // rotate bbox
      const bboXRotate =
        parseFloat(this.bboxElem.style.rotate.replace("deg", "")) || 0;
      this.bboxElem.style.rotate =
        bboXRotate + dAngle * (180 / Math.PI) + "deg";
    });

    const c = addUpListener(this.toolsArea, (_pos, e) => {
      if (this.state !== "ROTATE") return;
      e.stopPropagation();
      e.preventDefault();

      this.state = "SELECTED";

      console.groupCollapsed("[Rotate / save polygon ⭓]");
      for (const id of this.selectedObjects) {
        manager.focused.cachePolygon(id);
      }
      console.groupEnd();
      if (this.selectedObjects.length > 0) {
        manager.focused.saveAsHistory();
      }
      console.groupEnd();
    });

    this.bboxListenDestroiers.push(a);
    this.bboxListenDestroiers.push(b);
    this.bboxListenDestroiers.push(c);
  }

  setupBBox() {
    this.createBBox();
    this.listenBBoxMove();

    this.createBBoxScale();
    this.listenBBoxScale();

    this.createBBoxRotate();
    this.listenBBoxRotate();

    const removeButton = this.setupBBoxRemoveButton();
    this.bboxElem.appendChild(removeButton);

    const transformButton = this.setupBBoxTransformButton();
    this.bboxElem.appendChild(transformButton);

    const flipXButton = this.setupBBoxFlipXButton();
    this.bboxElem.appendChild(flipXButton);

    const flipYButton = this.setupBBoxFlipYButton();
    this.bboxElem.appendChild(flipYButton);

    const copyButton = this.setupBBoxCopyButton();
    this.bboxElem.appendChild(copyButton);

    const copy2clipboardButton = this.setupBBoxCopy2clipboardButton();
    this.bboxElem.appendChild(copy2clipboardButton);

    // listen for ctrl c
    const listener = (e: KeyboardEvent) => {
      if (e.key === "c" && (isMac ? e.metaKey : e.ctrlKey)) {
        console.log("copy2clipboard");
        manager.focused.getClipboardData(this.selectedObjects).then((data) => {
          const buf = encode(data) as Uint8Array;
          let res = getState("CLIPBOARD_PREFIX");
          for (let i = 0; i < buf.length; i++) {
            res += String.fromCharCode(buf[i]);
          }

          // copy buf to clipboard
          const type = "text/plain";
          const blob = new Blob([res], { type });

          navigator.clipboard.write([
            new ClipboardItem({
              [type]: blob,
            }),
          ]);
        });
      }
    };
    document.addEventListener("keydown", listener);
    this.bboxListenDestroiers.push(() => {
      document.removeEventListener("keydown", listener);
    });
  }

  handleSelect(objects: number[]) {
    this.selectedObjects = objects;
    this.state = "SELECTED";

    this.setupBBox();
  }
  disselect() {
    this.selectedObjects = [];
    this.state = "IDLE";
    this.destroyBBox();
  }

  apply() {
    const inst = createCanvas();
    this.toolsArea.appendChild(inst.canvas);

    inst.canvas.style.cursor = "crosshair";
    this.instCanvas = inst.canvas;

    let isDrawing = false;
    let points: { x: number; y: number }[] = [];

    const d1 = addDownListener(inst.canvas, (pos) => {
      if (this.state === "SELECTED") return;

      isDrawing = true;
      points = [pos];

      inst.ctx.strokeStyle = hslColor(1);
      inst.ctx.fillStyle = hslColor(0.3);
      inst.ctx.lineWidth = 3;
      inst.ctx.setLineDash([5, 5]);
    });

    const d2 = addMoveListener(document, (pos) => {
      if (!isDrawing) return;
      const MIN_DIST = getState("PEN_MIN_DIST") as number;
      const last = points[points.length - 1];
      const dist = Math.hypot(last.x - pos.x, last.y - pos.y);
      if (dist < MIN_DIST) return;

      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);

      points.push(pos);

      inst.ctx.beginPath();
      inst.ctx.moveTo(pos.x, pos.y);
      points.forEach((point) => {
        inst.ctx.lineTo(point.x, point.y);
      });
      inst.ctx.stroke();
      inst.ctx.fill();
      inst.ctx.closePath();
    });

    const d3 = addUpListener(document, (pos) => {
      if (this.state === "SELECTED") {
        this.state = "IDLE";
        this.destroyBBox();
        return;
      }
      if (!isDrawing) return;
      inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);

      isDrawing = false;
      points.push(pos);

      if (points.length < 10) {
        const avgX =
          points.reduce((acc, cur) => acc + cur.x, 0) / points.length;
        const avgY =
          points.reduce((acc, cur) => acc + cur.y, 0) / points.length;

        const sobj = manager.focused.pointSelect({
          x: avgX,
          y: avgY,
        });

        if (sobj.length == 0) return;
        this.handleSelect(sobj);
        return;
      }

      const selectedObjects = manager.focused.lassoSelect(points);

      if (selectedObjects.length === 0) return;
      this.handleSelect(selectedObjects);
    });

    return () => {
      this.toolsArea.removeChild(inst.canvas);
      this.destroyBBox();

      inst.destroy();

      d1();
      d2();
      d3();
    };
  }
}

registerTool("SEL", new SelTool(), true);
