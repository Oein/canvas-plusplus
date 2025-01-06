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

let pngBuf: {
  [key: string]: [
    Buffer,
    {
      start: { x: number; y: number };
      end: { x: number; y: number };
    }
  ];
} = {};

class CapwinHandler {
  private setPNGBuf: (
    buf: [
      Buffer,
      {
        start: { x: number; y: number };
        end: { x: number; y: number };
      }
    ]
  ) => void;
  private mainWindow: BrowserWindow;
  private capWin: BrowserWindow | null = null;
  private width: number;
  private height: number;
  constructor(
    setPNGBuf: (
      buf: [
        Buffer,
        {
          start: { x: number; y: number };
          end: { x: number; y: number };
        }
      ]
    ) => void,
    mainWindow: BrowserWindow,
    width: number,
    height: number
  ) {
    this.setPNGBuf = setPNGBuf;
    this.mainWindow = mainWindow;
    this.width = width;
    this.height = height;
  }

  createCapWin = () => {
    if (this.capWin) {
      try {
        this.capWin.close();
      } catch (e) {}
    }

    try {
      this.mainWindow.minimize();
    } catch (e) {}

    this.capWin = new BrowserWindow({
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
    this.capWin.loadFile(path.join(__dirname, "..", "web", "wincap.html"));
  };

  closeCapWin = () => {
    if (this.capWin) {
      try {
        this.capWin.close();
        this.mainWindow.maximize();
      } catch (e) {}
    }
  };

  reshowCapWin = () => {
    if (this.capWin) {
      try {
        this.capWin.setPosition(25, 25);
        this.capWin.setSize(100, 35);
      } catch (e) {}
    }
  };

  ready2cap = () => {
    if (this.capWin) {
      try {
        this.capWin.setPosition(0, 0);
        this.capWin.setBackgroundColor("#00000050");
        this.capWin.setSize(this.width, this.height);
      } catch (e) {}
    }
  };

  destroyCapWin = () => {
    if (this.capWin) {
      try {
        this.capWin.close();
      } catch (e) {}
    }
  };

  attachIPC = () => {
    // [Frontend] wincap
    // => Summon capture window
    // [Wincap] cat (data)
    // => Request Capture
    // [Wincap] esc
    // => Cancel capture
    // [Wincap] cap
    // => Start area select
    // [Wincap] btp
    // => Close capture window

    ipcMain.on("wincap", (event, arg) => {
      this.createCapWin();
    });
    ipcMain.on("btp", (event, arg) => {
      this.closeCapWin();
      this.mainWindow.webContents.send("cap");
    });
    ipcMain.on("cap", (event, arg) => {
      this.ready2cap();
    });
    ipcMain.on("esc", (event, arg) => {
      this.reshowCapWin();
    });
    ipcMain.on("cat", (event, arg) => {
      this.destroyCapWin();
      setTimeout(() => {
        const dd = arg as {
          start: { x: number; y: number };
          end: { x: number; y: number };
        };

        cap({
          format: "png",
        }).then((img) => {
          this.setPNGBuf([img, dd]);
          this.mainWindow.webContents.send("cap");

          this.createCapWin();
        });
      }, 50);
    });
  };
}

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // protocol handler
  protocol.handle("image", (req) => {
    const url = new URL(req.url);
    const path = url.pathname.replace("/", "");
    if (path.startsWith("list")) {
      return new Response(JSON.stringify(Object.keys(pngBuf)));
    }
    const qr = url.searchParams.get("qr");
    if (qr === "rm") {
      delete pngBuf[path];
      return new Response("OK");
    }
    if (qr === "pos") {
      return new Response(JSON.stringify(pngBuf[path][1]));
    }
    if (qr === "get") {
      return new Response(pngBuf[path][0], {
        headers: {
          "Content-Type": "image/png",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  });
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    resizable: true,
    width: width,
    height: height,
  });

  const capwinHandler = new CapwinHandler(
    (data) => {
      pngBuf[Math.random().toString(36).slice(2)] = data;
    },
    mainWindow,
    width,
    height
  );

  capwinHandler.attachIPC();

  setTimeout(() => {
    mainWindow.maximize();
    if (process.env.NODE_ENV === "development") {
      mainWindow.webContents.loadURL("http://localhost:5173");
    } else mainWindow.loadFile(path.join(__dirname, "..", "web", "index.html"));

    mainWindow.webContents.on("dom-ready", () => {
      mainWindow.webContents.send("screen", { width, height });
    });
  }, 100);
};

app.whenReady().then(createWindow);
