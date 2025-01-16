import Two from "two.js";
import genID from "../utils/genId";
import type { Path } from "two.js/src/path";
import type { Anchor } from "two.js/src/anchor";
import computeEllipsePolygon from "./ellipsePolygon";
import generateStrokedPolygon from "./penPolygon";
import computeLinePolygon from "./linePolygon";
import isPointInPolygon from "./pointInPoly";
import getPolygonIntersection from "./polygonIntersect";
import polygonArea from "./polygonArea";
import { getState } from "../utils/state";
import hslColor from "../utils/hslColor";
import { generateStrokePolygon as generateTriangleStrokePolygon } from "./triPoly";
import { generateRectangleStrokePolygon } from "./rectPoly";

export class Instance {
  id: string;
  root: HTMLElement;
  two: Two;

  twoElements: { [key: number]: Path } = {};
  cachecdPolygon: { [key: number]: { x: number; y: number }[] } = {};

  canvasData: { [key: number]: any } = {};

  focused: boolean = true;
  renderRequested: boolean = false;

  history: [any[], any][] = [[[], {}]];

  // === index manager ===
  lastID: number = 0;
  getNewID() {
    return this.lastID++;
  }

  // === Optimization for render ===
  setFocused(focused: boolean) {
    this.focused = focused;
  }

  focus() {
    this.focused = true;
  }

  blur() {
    this.focused = false;
  }

  requestRender() {
    this.renderRequested = true;
  }

  setupRequestFrame() {
    const render = () => {
      if (!this.focused) return requestAnimationFrame(render);
      if (this.renderRequested) {
        this.renderRequested = false;
        this.two.update();
      }
      requestAnimationFrame(render);
    };

    render();
  }

  constructor(root: HTMLElement) {
    console.log("[Instance 🎨] created");

    this.id = genID();
    this.root = document.createElement("div");
    this.root.id = this.id;
    this.root.className = "instance";

    this.two = new Two({
      type: Two.Types.canvas,
    });
    this.two.width = window.innerWidth;
    this.two.height = window.innerHeight;
    this.two.appendTo(this.root);
    root.appendChild(this.root);

    this.setupRequestFrame();
  }

  appendRectangle(props: {
    x: number;
    y: number;
    width: number;
    height: number;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  }) {
    // Create a new rectangle as Polygon(two.path)
    const rectPoints = [
      new Two.Anchor(props.x, props.y),
      new Two.Anchor(props.x + props.width, props.y),
      new Two.Anchor(props.x + props.width, props.y + props.height),
      new Two.Anchor(props.x, props.y + props.height),
    ];

    const rect = this.two.makePath(rectPoints);

    rect.fill = props.fillColor;
    rect.stroke = props.strokeColor;
    rect.linewidth = props.strokeWidth;

    const id = this.getNewID();
    this.twoElements[id] = rect;
    this.cachecdPolygon[id] = [
      { x: props.x, y: props.y },
      { x: props.x + props.width, y: props.y },
      { x: props.x + props.width, y: props.y + props.height },
      { x: props.x, y: props.y + props.height },
    ];
    if (props.fillColor === "transparent") {
      this.canvasData[id] = "RECT";
      this.cachecdPolygon[id] = generateRectangleStrokePolygon(
        [
          { x: props.x, y: props.y },
          { x: props.x + props.width, y: props.y },
          { x: props.x + props.width, y: props.y + props.height },
          { x: props.x, y: props.y + props.height },
        ],
        props.strokeWidth
      );
    }
    return id;
  }

  appendCircle(props: {
    x: number;
    y: number;
    xRadius: number;
    yRadius: number;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  }) {
    const computed = computeEllipsePolygon(
      props.x,
      props.y,
      props.xRadius,
      props.yRadius,
      360
    );

    const poitns = [...computed].map((point) => {
      return new Two.Anchor(point.x, point.y);
    });

    const circle = this.two.makePath(poitns);
    circle.fill = props.fillColor;
    circle.stroke = props.strokeColor;
    circle.linewidth = props.strokeWidth;

    const id = this.getNewID();
    this.twoElements[id] = circle;
    this.cachecdPolygon[id] = [...computed];
    if (props.fillColor === "transparent") {
      this.canvasData[id] = "CIR";
      this.cachecdPolygon[id] = generateStrokedPolygon(
        computed,
        props.strokeWidth
      );
    }
    return id;
  }

  appendTriangle(props: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3: number;
    y3: number;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  }) {
    const triangle = this.two.makePath([
      new Two.Anchor(props.x1, props.y1),
      new Two.Anchor(props.x2, props.y2),
      new Two.Anchor(props.x3, props.y3),
    ]);
    triangle.fill = props.fillColor;
    triangle.stroke = props.strokeColor;
    triangle.linewidth = props.strokeWidth;

    const id = this.getNewID();
    this.twoElements[id] = triangle;
    this.cachecdPolygon[id] = [
      { x: props.x1, y: props.y1 },
      { x: props.x2, y: props.y2 },
      { x: props.x3, y: props.y3 },
    ];

    if (props.fillColor === "transparent") {
      this.canvasData[id] = "TRI";
      this.cachecdPolygon[id] = generateTriangleStrokePolygon(
        [
          { x: props.x1, y: props.y1 },
          { x: props.x2, y: props.y2 },
          { x: props.x3, y: props.y3 },
        ],
        props.strokeWidth
      );
    }
    return id;
  }

  appendPenPath(props: {
    points: { x: number; y: number }[];
    strokeColor: string;
    strokeWidth: number;
  }) {
    const poly = generateStrokedPolygon([...props.points], props.strokeWidth);
    const id = this.getNewID();
    this.cachecdPolygon[id] = [...poly];
    const path = this.two.makePath(
      // @ts-ignore
      props.points.map((x) => {
        return new Two.Anchor(x.x, x.y);
      }),
      false,
      true
    );
    path.stroke = props.strokeColor;
    path.linewidth = props.strokeWidth;
    path.fill = "transparent";

    this.twoElements[id] = path;
    this.canvasData[id] = "PEN";
    return id;
  }

  appendLine(props: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    strokeColor: string;
    strokeWidth: number;
    dashArray?: number[];
  }) {
    const line = this.two.makePath([
      new Two.Anchor(props.x1, props.y1),
      new Two.Anchor(props.x2, props.y2),
    ]);
    line.stroke = props.strokeColor;
    line.linewidth = props.strokeWidth;
    line.dashes = props.dashArray || [];

    const id = this.getNewID();
    this.twoElements[id] = line;
    this.cachecdPolygon[id] = computeLinePolygon(
      { x: props.x1, y: props.y1 },
      { x: props.x2, y: props.y2 },
      props.strokeWidth
    );
    this.canvasData[id] = "LINE";
    return id;
  }

  appendImage(props: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotate: number;
    image: HTMLImageElement;
  }) {
    const texture = new Two.Texture(props.image, () => {});
    const image = this.two.makeSprite(texture, props.x, props.y);
    // image.scale = new Two.Vector(0.6, 0.6);
    image.width = props.width;
    image.height = props.height;
    image.rotation = props.rotate;
    image.position = new Two.Vector(props.x, props.y);

    const imageXS = props.width / texture.image.width;
    const imageYS = props.height / texture.image.height;
    image.scale = new Two.Vector(imageXS, imageYS);

    const id = this.getNewID();
    this.twoElements[id] = image;
    let halfWidth = props.width / 2;
    let halfHeight = props.height / 2;

    this.cachecdPolygon[id] = [
      { x: props.x - halfWidth, y: props.y - halfHeight },
      { x: props.x + halfWidth, y: props.y - halfHeight },
      { x: props.x + halfWidth, y: props.y + halfHeight },
      { x: props.x - halfWidth, y: props.y + halfHeight },
    ];
    return id;
  }

  toTop(id: number | number[]) {
    if (Array.isArray(id)) {
      for (const i of id) {
        this.toTop(i);
      }
      return;
    }

    const element = this.twoElements[id];
    this.two.scene.add(element);
  }

  clear() {
    this.two.clear();
    this.twoElements = [];
  }

  setTransform(id: number, move: number): void;
  setTransform(id: number, x: number, y?: number) {
    const element = this.twoElements[id];
    if (typeof y === "undefined") {
      element.translation.set(x, x);
      return;
    }
    element.translation.set(x, y);
  }

  transform(id: number, dx: number, dy: number) {
    const element = this.twoElements[id];
    element.translation.add(new Two.Vector(dx, dy));
  }

  // Rotate the element by the angle in radians
  rotate(id: number, angle: number) {
    const element = this.twoElements[id];
    element.rotation += angle;
  }

  rotateAbout(id: number, angle: number, x: number, y: number) {
    const element = this.twoElements[id];
    // Current position of the element
    const cx = element.translation.x;
    const cy = element.translation.y;

    // Translate element relative to (x, y) as origin
    const dx = cx - x;
    const dy = cy - y;

    // Apply rotation using the rotation matrix
    const cosTheta = Math.cos(angle);
    const sinTheta = Math.sin(angle);

    const newX = dx * cosTheta - dy * sinTheta;
    const newY = dx * sinTheta + dy * cosTheta;

    // Update element translation and rotation
    element.translation.set(newX + x, newY + y);
    const multix =
      typeof element.scale === "number" ? element.scale : element.scale.x;
    const multiy =
      typeof element.scale === "number" ? element.scale : element.scale.y;
    const negx = multix >= 0 ? 1 : -1;
    const negy = multiy >= 0 ? 1 : -1;
    element.rotation += angle * negx * negy;
  }

  setRotate(id: number, angle: number) {
    const element = this.twoElements[id];
    element.rotation = angle;
  }

  setScale(id: number, nscale: number): void;
  setScale(
    id: number,
    sx: {
      x: number;
      y: number;
    }
  ): void;
  setScale(
    id: number,
    sx:
      | number
      | {
          x: number;
          y: number;
        },
    sy?: number
  ) {
    const element = this.twoElements[id];
    console.log("Scale", sx, sy);
    if (typeof sy === "undefined") {
      if (typeof sx == "object") {
        element.scale = new Two.Vector(sx.x, sx.y);
        return;
      }
      element.scale = sx;
      return;
    } else {
      if (typeof sx === "number") {
        element.scale = new Two.Vector(sx, sy);
        return;
      }
      element.scale = new Two.Vector(sx.x, sx.y);
    }
  }

  scaleAboutSelf(id: number, sx: number, sy: number) {
    const element = this.twoElements[id];
    const elsc = element.scale;
    if (typeof elsc === "number") {
      element.scale = new Two.Vector(elsc * sx, elsc * sx);
    } else {
      element.scale = new Two.Vector(elsc.x * sx, elsc.y * sy);
    }
  }

  scaleAboutRect(
    id: number,
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
    sx: number,
    sy: number
  ) {
    const element = this.twoElements[id];
    const elpos = element.translation;
    const elsc = element.scale;

    if (typeof elsc === "number") {
      element.scale = new Two.Vector(elsc * sx, elsc * sy);
    } else {
      element.scale = new Two.Vector(elsc.x * sx, elsc.y * sy);
    }

    element.translation.x = elpos.x * sx + (1 - sx) * rect.x;
    element.translation.y = elpos.y * sy + (1 - sy) * rect.y;
  }

  flipX(id: number, centerX: number) {
    const element = this.twoElements[id];
    const elpos = element.translation;
    const elsc = element.scale;

    if (typeof elsc === "number") {
      element.scale = new Two.Vector(-elsc, elsc);
    } else {
      element.scale = new Two.Vector(-elsc.x, elsc.y);
    }

    element.translation.x = 2 * centerX - elpos.x;

    this.cachePolygon(id);
  }

  flipY(id: number, centerY: number) {
    const element = this.twoElements[id];
    const elpos = element.translation;
    const elsc = element.scale;

    if (typeof elsc === "number") {
      element.scale = new Two.Vector(elsc, -elsc);
    } else {
      element.scale = new Two.Vector(elsc.x, -elsc.y);
    }

    element.translation.y = 2 * centerY - elpos.y;

    this.cachePolygon(id);
  }

  cloneObject(id: number) {
    const element = this.twoElements[id];
    if (element instanceof Two.Sprite) {
      const newID = this.appendImage({
        x: element.position.x,
        y: element.position.y,
        width: element.width,
        height: element.height,
        rotate: element.rotation,
        image: element.texture.image as HTMLImageElement,
      });
      this.twoElements[newID].rotation = element.rotation;
      if (typeof element.scale === "number")
        this.twoElements[newID].scale = new Two.Vector(
          element.scale,
          element.scale
        );
      else
        this.twoElements[newID].scale = new Two.Vector(
          element.scale.x,
          element.scale.y
        );

      return newID;
    }

    const clone =
      this.canvasData[id] === "PEN"
        ? this.two.makePath(
            element.vertices.map((v: Anchor) => {
              return new Two.Anchor(v.x, v.y);
            }),
            // @ts-ignore
            false,
            true
          )
        : this.two.makePath(
            element.vertices.map((v: Anchor) => {
              return new Two.Anchor(v.x, v.y);
            })
          );

    clone.fill = element.fill;
    clone.stroke = element.stroke;
    clone.linewidth = element.linewidth + 0;

    clone.translation = new Two.Vector(
      element.translation.x,
      element.translation.y
    );
    clone.rotation = element.rotation + 0;
    clone.scale = new Two.Vector(
      typeof element.scale === "number"
        ? element.scale + 0
        : element.scale.x + 0,
      typeof element.scale === "number"
        ? element.scale + 0
        : element.scale.y + 0
    );

    clone.dashes = [...element.dashes];

    const newID = this.getNewID();
    this.twoElements[newID] = clone as Path;
    this.cachecdPolygon[newID] = [...this.cachecdPolygon[id]];
    this.canvasData[newID] = this.canvasData[id];

    return newID;
  }

  cachePolygon(id: number) {
    // try {
    //   throw new Error("Cache polygon");
    // } catch (e: any) {
    //   console.error(e);
    // }
    const element = this.twoElements[id];
    const scaleX =
      typeof element.scale === "number" ? element.scale : element.scale.x;
    const scaleY =
      typeof element.scale === "number" ? element.scale : element.scale.y;
    if (element.vertices.length == 2) {
      const xydata = element.vertices.map((v: Anchor) => {
        // Apply transform, rotation and scale
        const cosTheta = Math.cos(element.rotation);
        const sinTheta = Math.sin(element.rotation);

        const x = v.x * scaleX;
        const y = v.y * scaleY;

        const newX = x * cosTheta - y * sinTheta;
        const newY = x * sinTheta + y * cosTheta;

        return {
          x: newX + element.position.x,
          y: newY + element.position.y,
        };
      });
      this.cachecdPolygon[id] = computeLinePolygon(
        xydata[0],
        xydata[1],
        element.linewidth
      );
      console.log("[CachePolygon ⭔] Line", this.cachecdPolygon[id]);
      return;
    }

    if (this.canvasData[id] === "PEN") {
      const poly = element.vertices.map((v: Anchor) => {
        // Apply transform, rotation and scale
        const cosTheta = Math.cos(element.rotation);
        const sinTheta = Math.sin(element.rotation);

        const x = v.x * scaleX;
        const y = v.y * scaleY;

        const newX = x * cosTheta - y * sinTheta;
        const newY = x * sinTheta + y * cosTheta;

        return {
          x: newX + element.position.x,
          y: newY + element.position.y,
        };
      });
      this.cachecdPolygon[id] = generateStrokedPolygon(poly, element.linewidth);
      console.log("[CachePolygon ⭔] Pen", this.cachecdPolygon[id]);
      return;
    }
    if (this.canvasData[id] === "TRI") {
      const poly = element.vertices.map((v: Anchor) => {
        // Apply transform, rotation and scale
        const cosTheta = Math.cos(element.rotation);
        const sinTheta = Math.sin(element.rotation);

        const x = v.x * scaleX;
        const y = v.y * scaleY;

        const newX = x * cosTheta - y * sinTheta;
        const newY = x * sinTheta + y * cosTheta;

        return {
          x: newX + element.position.x,
          y: newY + element.position.y,
        };
      });
      this.cachecdPolygon[id] = generateTriangleStrokePolygon(
        poly,
        element.linewidth
      );
      console.log("[CachePolygon ⭔] Triangle", this.cachecdPolygon[id]);
      return;
    }
    if (this.canvasData[id] === "CIR") {
      const poly = element.vertices.map((v: Anchor) => {
        // Apply transform, rotation and scale
        const cosTheta = Math.cos(element.rotation);
        const sinTheta = Math.sin(element.rotation);

        const x = v.x * scaleX;
        const y = v.y * scaleY;

        const newX = x * cosTheta - y * sinTheta;
        const newY = x * sinTheta + y * cosTheta;

        return {
          x: newX + element.position.x,
          y: newY + element.position.y,
        };
      });
      this.cachecdPolygon[id] = generateStrokedPolygon(poly, element.linewidth);
      console.log("[CachePolygon ⭔] Circle", this.cachecdPolygon[id]);
      return;
    }
    if (this.canvasData[id] === "RECT") {
      const poly = element.vertices.map((v: Anchor) => {
        // Apply transform, rotation and scale
        const cosTheta = Math.cos(element.rotation);
        const sinTheta = Math.sin(element.rotation);

        const x = v.x * scaleX;
        const y = v.y * scaleY;

        const newX = x * cosTheta - y * sinTheta;
        const newY = x * sinTheta + y * cosTheta;

        return {
          x: newX + element.position.x,
          y: newY + element.position.y,
        };
      });
      this.cachecdPolygon[id] = generateRectangleStrokePolygon(
        poly,
        element.linewidth
      );
      console.log("[CachePolygon ⭔] Rectangle", this.cachecdPolygon[id]);
      return;
    }
    this.cachecdPolygon[id] = element.vertices.map((v: Anchor) => {
      // Apply transform, rotation and scale
      const cosTheta = Math.cos(element.rotation);
      const sinTheta = Math.sin(element.rotation);

      const x = v.x * scaleX;
      const y = v.y * scaleY;

      const newX = x * cosTheta - y * sinTheta;
      const newY = x * sinTheta + y * cosTheta;

      return {
        x: newX + element.position.x,
        y: newY + element.position.y,
      };
    });
    console.log("[CachePolygon ⭔] Polygon", this.cachecdPolygon[id]);
  }

  removeElement(id: number) {
    this.twoElements[id].remove();
    delete this.twoElements[id];
    delete this.cachecdPolygon[id];
  }

  removeAt(pos: { x: number; y: number }) {
    const removed: number[] = [];
    for (const id in this.twoElements) {
      if (isPointInPolygon(pos, (this.cachecdPolygon as any)[id])) {
        this.removeElement(Number(id));
        removed.push(Number(id));
      }
    }
    return removed;
  }

  lassoSelect(lassoPoly: { x: number; y: number }[]): number[] {
    const selected: number[] = [];

    for (const key in this.twoElements) {
      const intersect = getPolygonIntersection(
        this.cachecdPolygon[Number(key)],
        lassoPoly
      );
      if (intersect.length == 0) continue;
      let area = 0;
      const elementArea = polygonArea(this.cachecdPolygon[Number(key)]);
      for (const poly of intersect) {
        area += polygonArea(poly);
      }

      if (area >= elementArea * getState("MIN_SELECT_PERCENT"))
        selected.push(Number(key));
    }

    return selected;
  }

  pointSelect(pos: { x: number; y: number }): number[] {
    // get the heightest element at the point
    let highest = -1;
    let highestID = -1;
    for (const key in this.twoElements) {
      if (isPointInPolygon(pos, this.cachecdPolygon[Number(key)])) {
        if (Number(key) > highest) {
          highest = Number(key);
          highestID = Number(key);
        }
      }
    }

    if (highestID !== -1) return [highestID];
    return [];
  }

  strcClone(data: any) {
    const clone = JSON.parse(JSON.stringify(data));
    // dfs in object, and clone html image
    const dfs = (obj: any, clo: any) => {
      for (const key in obj) {
        if (obj[key] instanceof HTMLImageElement) {
          clo[key] = obj[key];
        } else if (key in clo && typeof obj[key] === "object") {
          dfs(obj[key], clo[key]);
        }
      }
    };

    dfs(data, clone);

    console.log("Original", data);
    console.log("Cloned", clone);

    return clone;
  }

  saveAsHistory() {
    console.groupCollapsed("[Save as history 📋]");
    const elements = Object.keys(this.twoElements).map((id) => {
      return this.exportElement(Number(id));
    });

    const historyData = [
      this.strcClone(elements),
      structuredClone(this.canvasData),
    ];
    console.log("Save as history", historyData);
    this.history.push(historyData as any);

    if (this.history.length > 100) this.history.shift();
    console.groupEnd();
  }

  undo() {
    if (this.history.length <= 1) return;
    console.groupCollapsed("[Undo ⏪]");
    this.history.pop();
    const history = this.history[this.history.length - 1];
    const elements = history[0];
    const canvasData = history[1];
    this.clear();

    for (const key in elements) {
      const element = elements[key];
      if (element.type === "image") {
        this.appendImage(element);
      } else {
        const nid = this.getNewID();
        console.groupCollapsed("[Undo.NewObj-Path ⏪]", nid);
        this.twoElements[nid] =
          canvasData[key] === "PEN"
            ? this.two.makePath(
                element.points.map((v: { x: number; y: number }) => {
                  return new Two.Anchor(v.x, v.y);
                }),
                // @ts-ignore
                false,
                true
              )
            : this.two.makePath(
                element.points.map((v: { x: number; y: number }) => {
                  return new Two.Anchor(v.x, v.y);
                })
              );

        const e = this.twoElements[nid];
        e.fill = element.fillColor;
        console.log("{Fill}", element.fillColor);
        e.stroke = element.strokeColor;
        console.log("{Stroke}", element.strokeColor);
        e.linewidth = element.strokeWidth;
        e.dashes = element.dash;
        console.log("{Scale}", element.scale);
        this.setScale(nid, element.scale);
        console.log("{Keys}", Object.keys(element));
        this.canvasData[nid] = canvasData[key];
        this.cachePolygon(nid);
        console.log(
          "{Path}",
          element.points.map((v: { x: number; y: number }) => {
            return new Two.Anchor(v.x, v.y);
          })
        );

        console.groupEnd();
      }
    }

    console.groupEnd();
  }

  exportElement(id: number, texture_as_url?: boolean): any {
    const element = this.twoElements[id];
    const elementPos = element.position;
    if (element instanceof Two.Sprite) {
      let texture = element.texture.image as HTMLImageElement;
      if (texture_as_url) {
        return new Promise<any>(async (resolve) => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = texture.width;
          canvas.height = texture.height;
          ctx!.drawImage(texture, 0, 0);
          const dataURL = canvas.toDataURL("image/webp");
          const arrayBuffer = await fetch(dataURL).then((res) =>
            res.arrayBuffer()
          );
          resolve({
            type: "image",
            x: elementPos.x,
            y: elementPos.y,
            width:
              element.width *
              (typeof element.scale == "number"
                ? element.scale
                : element.scale.x),
            height:
              element.height *
              (typeof element.scale == "number"
                ? element.scale
                : element.scale.y),
            rotate: element.rotation,
            image: arrayBuffer,
            scale:
              typeof element.scale === "number"
                ? element.scale
                : {
                    x: element.scale.x,
                    y: element.scale.y,
                  },
            canvasData: this.canvasData[id],
          });
        });
      }

      return {
        type: "image",
        x: elementPos.x,
        y: elementPos.y,
        width:
          element.texture.image.width *
          (typeof element.scale == "number" ? element.scale : element.scale.x),
        height:
          element.texture.image.height *
          (typeof element.scale == "number" ? element.scale : element.scale.y),
        rotate: element.rotation,
        image: texture,
        scale:
          typeof element.scale === "number"
            ? element.scale
            : {
                x: element.scale.x,
                y: element.scale.y,
              },
      };
    }
    return {
      type: "path",
      points: element.vertices.map((v: Anchor) => {
        const cosTheta = Math.cos(element.rotation);
        const sinTheta = Math.sin(element.rotation);

        const x = v.x;
        const y = v.y;

        const newX = x * cosTheta - y * sinTheta;
        const newY = x * sinTheta + y * cosTheta;

        return { x: newX + element.position.x, y: newY + element.position.y };
      }),

      fillColor: element.fill,
      strokeColor: element.stroke,
      strokeWidth: element.linewidth,
      dash: element.dashes,
      isPen: this.canvasData[id] === "PEN",
      canvasData: this.canvasData[id],
      scale:
        typeof element.scale === "number"
          ? element.scale + 0
          : {
              x: element.scale.x + 0,
              y: element.scale.y + 0,
            },
    };
  }

  async getClipboardData(objectIds: number[]) {
    const res: any[] = [];
    for (const id of objectIds) {
      res.push(await this.exportElement(id, true));
    }
    return res;
  }

  exportAsImage() {
    const canvas = this.two.renderer.domElement as HTMLCanvasElement;
    return new Promise<string>((resolve, rej) => {
      canvas.toBlob((blob) => {
        if (!blob) return rej("Failed to export as image");
        const url = URL.createObjectURL(blob);
        resolve(url);
      });
    });
  }

  async exportAsJSON() {
    const elements = await Promise.all(
      Object.keys(this.twoElements).map((id) => {
        return this.exportElement(Number(id), true);
      })
    );

    return elements;
  }

  async importFromJSON(data: any[]) {
    this.clear();

    for (const element of data) {
      if (typeof element !== "object") {
        console.error("Invalid element", element);
        continue;
      }
      if (element.type === "image") {
        const img = new Image();

        const blob = new Blob([element.image], { type: "image/webp" });

        await new Promise<void>((resolve) => {
          img.onload = () => {
            img.onload = null;

            const nid = this.appendImage({
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              image: img,
              rotate: element.rotate,
            });
            this.twoElements[nid].rotation = element.rotate;
            if (typeof element.scale === "number")
              this.twoElements[nid].scale = new Two.Vector(
                element.scale,
                element.scale
              );
            else
              this.twoElements[nid].scale = new Two.Vector(
                element.scale.x,
                element.scale.y
              );

            resolve();
          };

          const url = URL.createObjectURL(blob);
          img.src = url;
        });
      } else {
        const nid = this.getNewID();
        this.twoElements[nid] = element.isPen
          ? this.two.makePath(
              element.points.map((v: { x: number; y: number }) => {
                return new Two.Anchor(v.x, v.y);
              }),
              // @ts-ignore
              false,
              true
            )
          : this.two.makePath(
              element.points.map((v: { x: number; y: number }) => {
                return new Two.Anchor(v.x, v.y);
              })
            );

        const e = this.twoElements[nid];
        e.fill = element.fillColor;
        e.stroke = element.strokeColor;
        e.linewidth = element.strokeWidth;
        e.dashes = element.dash;
        this.setScale(nid, element.scale);

        const poly = element.points.map((v: { x: number; y: number }) => {
          return { x: v.x, y: v.y };
        });
        const polystroke = generateStrokedPolygon(poly, element.strokeWidth);
        this.cachecdPolygon[nid] = [...polystroke];
        this.canvasData[nid] = element.isPen ? "PEN" : "PATH";
      }
    }

    this.requestRender();
  }

  async importFromClipboard(data: any[]) {
    let ids: number[] = [];
    console.groupCollapsed(
      "[ImportFromClipboard 📋] Import",
      data.length,
      "items"
    );
    for (const element of data) {
      if (element.type === "image") {
        const img = new Image();

        const blob = new Blob([element.image], { type: "image/webp" });

        await new Promise<void>((resolve) => {
          img.onload = () => {
            img.onload = null;

            const nid = this.appendImage({
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              image: img,
              rotate: element.rotate,
            });
            ids.push(nid);
            this.twoElements[nid].rotation = element.rotate;
            if (typeof element.scale === "number")
              this.twoElements[nid].scale = new Two.Vector(
                element.scale,
                element.scale
              );
            else
              this.twoElements[nid].scale = new Two.Vector(
                element.scale.x,
                element.scale.y
              );

            resolve();
          };

          const url = URL.createObjectURL(blob);
          img.src = url;
        });
      } else {
        const nid = this.getNewID();
        ids.push(nid);
        this.twoElements[nid] = element.isPen
          ? this.two.makePath(
              element.points.map((v: { x: number; y: number }) => {
                return new Two.Anchor(v.x, v.y);
              }),
              // @ts-ignore
              false,
              true
            )
          : this.two.makePath(
              element.points.map((v: { x: number; y: number }) => {
                return new Two.Anchor(v.x, v.y);
              })
            );

        const e = this.twoElements[nid];
        e.fill = element.fillColor;
        e.stroke = element.strokeColor;
        e.linewidth = element.strokeWidth;
        e.dashes = element.dash;
        this.setScale(nid, element.scale);

        this.canvasData[nid] = element.canvasData;
        // console.log("[CanvasData]", nid, element.canvasData);
        this.cachePolygon(nid);
      }
    }

    console.groupEnd();

    this.requestRender();
    this.saveAsHistory();

    return ids;
  }

  destroy() {
    this.two.clear();
    this.two.unbind();
    this.root.remove();
  }

  cachedPolygonCanvas: HTMLCanvasElement | null = null;
  showCachedPolygon() {
    this.cachedPolygonCanvas = document.createElement("canvas");
    const ctx = this.cachedPolygonCanvas.getContext("2d");
    this.cachedPolygonCanvas.width = window.innerWidth;
    this.cachedPolygonCanvas.height = window.innerHeight;

    if (!ctx) return;

    ctx.fillStyle = hslColor(0.5);
    ctx.strokeStyle = hslColor(1);

    for (const key in this.cachecdPolygon) {
      const poly = this.cachecdPolygon[Number(key)];
      if (!poly || poly.length < 2) {
        console.log("Invalid polygon", poly, this.twoElements[Number(key)]);
        continue;
      }
      ctx!.beginPath();
      ctx!.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) {
        ctx!.lineTo(poly[i].x, poly[i].y);
      }
      ctx!.closePath();
      ctx!.stroke();
      ctx!.fill();
    }

    this.cachedPolygonCanvas.style.position = "absolute";
    this.cachedPolygonCanvas.style.top = "0";
    this.cachedPolygonCanvas.style.left = "0";
    this.cachedPolygonCanvas.style.zIndex = "9999";
    document.body.appendChild(this.cachedPolygonCanvas);
  }

  hideCachedPolygon() {
    this.cachedPolygonCanvas?.remove();
    this.cachedPolygonCanvas = null;
  }
}
