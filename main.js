// main.js
const { app, BrowserWindow, ipcMain, dialog, webContents } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const prompt = require('electron-prompt');
const pty = require("node-pty");
const os = require("os");

// Detecta el shell según el sistema operativo
const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

let ideWindow;  // Ventana para el IDE
let terminalWebContents = null; // Aquí se almacenará el webContents del webview (terminal)

// Función para crear la ventana del IDE (única ventana)
function createIDEWindow() {
  ideWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true // Habilita el uso de <webview>
    }
  });

  ideWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  ideWindow.on("closed", () => {
    ideWindow = null;
  });

  ideWindow.webContents.on('did-attach-webview', (event, attachedWebContents) => {
    terminalWebContents = attachedWebContents;
    console.log('Terminal webContents attached:', terminalWebContents.id);

  });
  
}

app.on("ready", () => {
  createIDEWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (ideWindow === null) {
    createIDEWindow();
  }
});

// Importación dinámica de electron-store (ESM)
let store;
(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store();
})();

// Manejo del diálogo para abrir carpetas y guardar la última ruta
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled) {
    const folderPath = result.filePaths[0];
    store.set('lastProjectPath', folderPath);
    return scanFolder(folderPath);
  }
});

ipcMain.handle('project:getLast', () => {
  const lastPath = store.get('lastProjectPath');
  return lastPath ? scanFolder(lastPath) : null;
});

// Función para escanear directorios
function scanFolder(dirPath) {
  const items = fs.readdirSync(dirPath);
  return items
    .filter(item => !item.startsWith('.'))
    .map(item => {
      const itemPath = path.join(dirPath, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();
      return {
        name: item,
        path: itemPath,
        isDirectory,
        children: isDirectory ? scanFolder(itemPath) : []
      };
    });
}

// IPC para abrir, crear, guardar archivos y crear directorios
ipcMain.handle('file:open', async (event, filePath) => {
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
});

ipcMain.handle('file:create', async (_, filePath) => {
  await fs.ensureFile(filePath);
  return true;
});

ipcMain.handle('directory:create', async (_, dirPath) => {
  await fs.ensureDir(dirPath);
  return true;
});

ipcMain.handle('file:save', async (_, filePath, content) => {
  await fs.writeFile(filePath, content, 'utf-8');
});

ipcMain.handle('get:lastProjectPath', () => store.get('lastProjectPath'));

ipcMain.handle('prompt:show', async (_, message) => {
  return prompt({
    title: 'CyberNeon IDE',
    label: message,
    inputAttrs: {
      type: 'text'
    },
    type: 'input'
  });
});

// Crear el proceso pty (común para la terminal)
const ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: {
    ...process.env,
    PS1: "\\[\\033[1;34m\\]\\u@\\h \\[\\033[1;32m\\]\\w\\[\\033[0m\\]\\$ "
  }
});

// Envía datos del shell al webview de la terminal (si está disponible)
ptyProcess.on("data", (data) => {
  if (terminalWebContents) {
    terminalWebContents.send("terminal.incomingData", data);
  }
});

// Recibe datos escritos en la terminal (dentro del webview)
ipcMain.on("terminal.keystroke", (event, key) => {
  ptyProcess.write(key);
});
