// main.js

// Load environment variables
require('dotenv').config();

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { initStore } = require('./utils/config');
const { setupIpcHandlers } = require('./utils/projectUtils');
const { initTerminal } = require('./utils/ptyUtils');
const { verifyCredentials } = require('./utils/speechUtils');

verifyCredentials();

let ideWindow = null;

function createIDEWindow() {
  ideWindow = new BrowserWindow({
    width: 1800,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    },
    icon: path.join(__dirname, 'icon.png'),
  });

  ideWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  ideWindow.on('closed', () => ideWindow = null);
  return ideWindow;
}

app.whenReady().then(async () => {
  // Necesitamos async aquí para poder await initStore()
  if (process.platform === 'win32') {
    app.setAppUserModelId(process.execPath);
  }
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'icon.png'));
  }

  ideWindow = createIDEWindow();

  // Esperamos a que initStore resuelva
  const store = await initStore();

  const { ptyProcess, terminalWebContents } = initTerminal(ideWindow);
  setupIpcHandlers(ipcMain, dialog, store, ptyProcess, terminalWebContents);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (ideWindow === null) createIDEWindow();
});
