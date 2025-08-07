const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const REACT_DEV_URL = "http://localhost:3000";
let apiProcess = null;

function waitForReactDevServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        })
        .on("error", retry);
      function retry() {
        if (Date.now() - start > timeout) {
          reject(new Error("Timed out waiting for React dev server"));
        } else {
          setTimeout(check, 300);
        }
      }
    }
    check();
  });
}

async function createWindow() {
  // Start API server in production
  if (process.env.NODE_ENV !== "development") {
    const apiPath = path.join(__dirname, "api");
    apiProcess = spawn("node", [path.join(apiPath, "bin", "www")], {
      cwd: apiPath,
      env: { ...process.env, NODE_ENV: "production" },
    });

    apiProcess.on("error", (err) => {
      console.error("Failed to start API server:", err);
    });

    // Wait a moment for API to start
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === "development") {
    try {
      await waitForReactDevServer(REACT_DEV_URL);
      win.loadURL(REACT_DEV_URL);
    } catch (e) {
      win.loadURL(
        "data:text/html,<h2>Could not connect to React dev server</h2>"
      );
    }
  } else {
    win.loadFile(path.join(__dirname, "react-app", "build", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // Kill API process when closing
  if (apiProcess) {
    apiProcess.kill();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  // Kill API process before quitting
  if (apiProcess) {
    apiProcess.kill();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
