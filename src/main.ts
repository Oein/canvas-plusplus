import InstanceManager from "./instance/manager";
import "./style.css";
import setupTool from "./menu";
import { getState } from "./utils/state";

export let manager: InstanceManager;

const main = () => {
  const drawnLayer = document.getElementById("drawnLayer");
  if (!drawnLayer) return;
  const mnger = new InstanceManager(drawnLayer);
  (window as any).manager = mnger;
  manager = mnger;

  setupTool();

  mnger.createInstance();
  mnger.focusInstance(0);

  try {
    let screenSZ = { width: 0, height: 0 };
    // @ts-ignore
    require("electron").ipcRenderer.on(
      "cap",
      (
        _e: any,
        data: {
          start: { x: number; y: number };
          end: { x: number; y: number };
        }
      ) => {
        // Fetch image from "image://png" then cut it by data and append it to the canvas
        const img = new Image();
        img.onload = () => {
          img.onload = null;
          const scale = img.width / screenSZ.width;
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) return;
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);

          const cut = context.getImageData(
            data.start.x * scale,
            data.start.y * scale,
            (data.end.x - data.start.x) * scale,
            (data.end.y - data.start.y) * scale
          );
          const cutCanvas = document.createElement("canvas");
          const cutContext = cutCanvas.getContext("2d");
          if (!cutContext) return;
          cutCanvas.width = (data.end.x - data.start.x) * scale;
          cutCanvas.height = (data.end.y - data.start.y) * scale;
          cutContext.putImageData(cut, 0, 0);

          const cutImg = new Image();
          cutImg.onload = () => {
            cutImg.onload = null;
            let [width, height] = [cutImg.width, cutImg.height];

            width /= scale;
            height /= scale;

            console.log(width, height);

            if (width > window.innerWidth - getState("IMAGE_GLOBAL_PADDING")) {
              height *=
                (window.innerWidth - getState("IMAGE_GLOBAL_PADDING")) / width;
              width = window.innerWidth - getState("IMAGE_GLOBAL_PADDING");
            }

            if (
              height >
              window.innerHeight - getState("IMAGE_GLOBAL_PADDING")
            ) {
              width *=
                (window.innerHeight - getState("IMAGE_GLOBAL_PADDING")) /
                height;
              height = window.innerHeight - getState("IMAGE_GLOBAL_PADDING");
            }

            manager.focused.appendImage({
              width,
              height,
              image: cutImg,
              rotate: 0,
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
            });
            manager.focused.requestRender();
          };
          cutImg.src = cutCanvas.toDataURL();
        };

        img.src = "image://png/" + Date.now();
      }
    );

    // @ts-ignore
    require("electron").ipcRenderer.on(
      "screen",
      (
        _e: any,
        data: {
          width: number;
          height: number;
        }
      ) => {
        screenSZ = data;
      }
    );
  } catch (e) {}

  const pasteImage = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") === -1) continue;
      const blob = items[i].getAsFile();
      if (!blob) continue;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          img.onload = null;
          const [width, height] = [img.width, img.height];
          let scale = 1;
          if (width > window.innerWidth - getState("IMAGE_GLOBAL_PADDING")) {
            scale =
              (window.innerWidth - getState("IMAGE_GLOBAL_PADDING")) / width;
          }
          if (
            height * scale >
            window.innerHeight - getState("IMAGE_GLOBAL_PADDING")
          ) {
            scale =
              (window.innerHeight - getState("IMAGE_GLOBAL_PADDING")) / height;
          }

          manager.focused.appendImage({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            width: width * scale,
            height: height * scale,
            image: img,
            rotate: 0,
          });
          manager.focused.requestRender();
        };

        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(blob);
    }
  };
  document.addEventListener("paste", pasteImage);
};

main();
