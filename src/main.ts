import InstanceManager from "./instance/manager";
import "./style.css";
import setupTool, { applyToolExternal, tools } from "./menu";
import { getState } from "./utils/state";
import { decode, encode } from "cbor-x";
import { SelTool } from "./menu/tools/sel";
import { addUpListener } from "./utils/listener";

import "./utils/toast";
import toastManager from "./utils/toast";

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

    const imageHandler = (
      id: string,
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

          if (height > window.innerHeight - getState("IMAGE_GLOBAL_PADDING")) {
            width *=
              (window.innerHeight - getState("IMAGE_GLOBAL_PADDING")) / height;
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

          fetch("image://imager/" + id + "?qr=rm");
        };
        cutImg.src = cutCanvas.toDataURL();
      };

      img.src = "image://imager/" + id + "?qr=get";
    };

    // @ts-ignore
    require("electron").ipcRenderer.on("cap", (_e: any) => {
      fetch("image://png/list?_=" + Date.now())
        .then((res) => res.json())
        .then((data: string[]) => {
          for (const id of data) {
            fetch("image://png/" + id + "?qr=pos")
              .then((res) => res.json())
              .then(
                (data: {
                  start: { x: number; y: number };
                  end: { x: number; y: number };
                }) => {
                  imageHandler(id, data);
                }
              );
          }
        });
    });

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

  const pasteData = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type === "text/plain") {
        items[i].getAsString((text) => {
          if (!text.startsWith(getState("CLIPBOARD_PREFIX"))) return;
          const data = text.slice(
            getState("CLIPBOARD_PREFIX").length
          ) as string;
          // data as uint8array
          const u8a = new Uint8Array(data.length);
          for (let i = 0; i < data.length; i++) {
            u8a[i] = data.charCodeAt(i);
          }
          const decoded = decode(u8a);
          manager.focused.importFromClipboard(decoded).then((el) => {
            applyToolExternal("SEL");
            setTimeout(() => {
              (tools.SEL as SelTool).handleSelect(el);
            });
          });
        });
        continue;
      }
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
  document.addEventListener("paste", pasteData);

  addUpListener(document.getElementById("stv"), (_, e) => {
    const self = e.target as HTMLElement;
    self.style.display = "none";
  });
  document.getElementById("stvc")?.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  addUpListener(document.getElementById("stvc"), (_, e) => {
    e.stopPropagation();
  });
  addUpListener(document.getElementById("cfg"), (_, e) => {
    e.stopPropagation();
    const wp = document.getElementById("stv");
    if (wp) {
      wp.style.display = "flex";
    }
  });

  setInterval(() => {
    // console.log("Applying paste prevention");
    const el = [
      ...document.querySelectorAll('input:not([data-pvap="true"])'),
      ...document.querySelectorAll('textarea:not([data-pvap="true"])'),
    ];
    el.forEach((e) => {
      // console.log("Applying paste prevention", e);
      e.setAttribute("data-pvap", "true");
      (e as HTMLInputElement).addEventListener("paste", (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      });
    });
  }, 50);

  // window resize
  window.addEventListener("resize", () => {
    manager.resize();
  });

  if (getState("ATBOTTOM")) {
    const disu = document.getElementById("disup");
    if (disu)
      (() => {
        disu.style.top = "unset";
        disu.style.bottom = "10px";
      })();
  }

  const autoSaver = async () => {
    const tid = toastManager.loading({
      message: "자동저장 중...",
      autoRemove: false,
    });
    console.groupCollapsed("[AutoSaver 📁]");

    let res: any[] = [];
    for (let i = 0; i < manager.instances.length; i++) {
      toastManager.updateToast(
        tid,
        `자동저장 중... (${i + 1}/${manager.instances.length})`
      );
      console.log(
        `[AutoSaver 📁] Saving instance ${i + 1} out of ${
          manager.instances.length
        }`
      );

      res.push(await manager.instances[i].exportAsJSON());
      await new Promise((res) => setTimeout(res, 100));
    }

    toastManager.updateToast(tid, `자동저장 중... (파일 생성 중)`);

    const file = encode(res);

    const u8a2base64 = (u8a: Uint8Array) => {
      let binstr = Array.prototype.map
        .call(u8a, (ch) => String.fromCharCode(ch))
        .join("");
      return btoa(encodeURIComponent(binstr));
    };

    // to string
    const str = u8a2base64(file);

    const time = new Date();
    const timeStr = `자동저장 - ${time.getFullYear()}년 ${
      time.getMonth() + 1
    }월 ${time.getDate()}일 ${time.getHours()}시 ${time.getMinutes()}분 ${time.getSeconds()}초${getState(
      "SAVE_EXTENSION"
    )}`;

    const list = localStorage.getItem("autosave-list");
    const listParsed = list ? JSON.parse(list) : [];
    listParsed.push(timeStr);
    while (listParsed.length > 8) {
      const shi = listParsed.shift();
      localStorage.removeItem("autosave-" + shi);
    }
    localStorage.setItem("autosave-list", JSON.stringify(listParsed));
    localStorage.setItem("autosave-" + timeStr, str);

    console.log("[AutoSaver 📁] Saved");
    toastManager.updateToast(tid, `자동저장 완료!`);
    setTimeout(() => {
      toastManager.removeToast(tid);
    }, 2000);
    console.groupEnd();
  };

  setInterval(() => {
    try {
      autoSaver();
    } catch (e) {}
  }, 1000 * 60 * 5);

  // setTimeout(() => {
  //   autoSaver();
  // }, 1000 * 7);
  (window as any).autoSaver = autoSaver;
};

main();
