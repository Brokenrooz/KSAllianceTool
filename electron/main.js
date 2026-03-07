const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

function getUserDataPath() {
  return path.join(app.getPath("userData"), "kingshot.json");
}

function readJsonSafe(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function writeJsonSafe(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
}

function ensureDataFile() {
  const userPath = getUserDataPath();
  if (fs.existsSync(userPath)) return;

  const seedPath = path.join(app.getAppPath(), "kingshot.json");
  const seed = readJsonSafe(seedPath) ?? { alliances: [] };
  writeJsonSafe(userPath, seed);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 720,
    backgroundColor: "#0b0b0b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(app.getAppPath(), "index.html"));
}

app.whenReady().then(() => {
  ensureDataFile();

  ipcMain.handle("ks:loadData", () => {
    return readJsonSafe(getUserDataPath()) ?? { alliances: [] };
  });

  ipcMain.handle("ks:saveData", (event, newData) => {
    if (!newData || typeof newData !== "object" || !Array.isArray(newData.alliances)) {
      throw new Error("Invalid data shape.");
    }
    writeJsonSafe(getUserDataPath(), newData);
    return true;
  });

  ipcMain.handle("ks:dataPath", () => getUserDataPath());

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});