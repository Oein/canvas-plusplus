import { app, BrowserWindow, ipcMain, screen, protocol } from "electron";
import path from "path";
import cap from "screenshot-desktop";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "image",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
  },
]);

let capWin: BrowserWindow;
let pngBuf: Buffer;
const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // protocol handler
  protocol.handle("image", (req) => {
    return new Response(pngBuf, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  });
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    resizable: false,
    width: width,
    height: height,
  });

  setTimeout(() => {
    mainWindow.maximize();
    if (process.env.NODE_ENV === "development") {
      mainWindow.webContents.loadURL("http://localhost:5173");
    } else mainWindow.loadFile(path.join(__dirname, "..", "web", "index.html"));

    mainWindow.webContents.on("dom-ready", () => {
      mainWindow.webContents.send("screen", { width, height });
    });

    ipcMain.on("btp", (event, arg) => {
      mainWindow.maximize();
      capWin.close();
    });

    ipcMain.on("cap", (event, arg) => {
      capWin.setPosition(0, 0);
      capWin.setSize(width, height);
      console.log("cap");
    });

    ipcMain.on("esc", (event, arg) => {
      capWin.setFullScreen(false);
      capWin.setKiosk(false);
      capWin.setPosition(25, 25);
      capWin.setSize(100, 35);
    });

    ipcMain.on("cat", (event, arg) => {
      capWin.close();

      //@ts-ignore
      capWin = null;
      setTimeout(() => {
        console.log(arg);
        const dd = arg as {
          start: { x: number; y: number };
          end: { x: number; y: number };
        };

        cap({
          format: "png",
        }).then((img) => {
          pngBuf = img;
          mainWindow.webContents.send("cap", dd);
          mainWindow.maximize();
        });
      }, 50);
    });

    ipcMain.on("wincap", (event, arg) => {
      mainWindow.minimize();

      capWin = new BrowserWindow({
        width: 100,
        height: 35,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
        alwaysOnTop: true,
        frame: false,
        fullscreen: false,
        resizable: false,
        x: 25,
        y: 25,
        transparent: true,
      });
      capWin.loadFile(path.join(__dirname, "..", "web", "wincap.html"));
    });
  }, 100);
};

app.whenReady().then(createWindow);
