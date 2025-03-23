const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const prompt = require('electron-prompt');


let store;

// Dynamic import para electron-store (ESM)
(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store();
})();

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

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  win.loadFile(path.join(__dirname, 'renderer/index.html'));
}

app.whenReady().then(createWindow);

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

// abrir archivo
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

ipcMain.handle('file:save', async (_, path, content) => {
  await fs.writeFile(path, content, 'utf-8');
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
