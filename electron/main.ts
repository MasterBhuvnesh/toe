import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { autoUpdater } from "electron-updater";

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "gdgico.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
    // hide the menu bar (auto shows when Alt is pressed on Windows/Linux)
    autoHideMenuBar: true,
  });

  // ensure menu is hidden
  mainWindow.setMenuBarVisibility(false);

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Auto-updater event handlers
autoUpdater.on("checking-for-update", () => {
  console.log("Checking for updates...");
  mainWindow?.webContents.send("update-status", "checking");
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info.version);
  mainWindow?.webContents.send("update-available", info);
});

autoUpdater.on("update-not-available", (info) => {
  console.log("Update not available");
  mainWindow?.webContents.send("update-not-available", info);
});

autoUpdater.on("error", (err) => {
  console.error("Update error:", err);
  mainWindow?.webContents.send("update-error", err);
});

autoUpdater.on("download-progress", (progressObj) => {
  console.log(
    `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
  );
  mainWindow?.webContents.send("download-progress", progressObj);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded");
  mainWindow?.webContents.send("update-downloaded", info);
});

// IPC handlers for renderer process
ipcMain.handle("check-for-updates", async () => {
  if (process.env.NODE_ENV === "development") {
    return { available: false, message: "Updates disabled in development" };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    console.error("Error checking for updates:", error);
    return error instanceof Error ? error.message : String(error);
  }
});

ipcMain.handle("download-update", async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error("Error downloading update:", error);
    return error instanceof Error ? error.message : String(error);
  }
});

ipcMain.handle("install-update", () => {
  autoUpdater.quitAndInstall(false, true);
});

app.whenReady().then(() => {
  createWindow();

  // Check for updates after 3 seconds (give time for app to load)
  if (process.env.NODE_ENV !== "development") {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
