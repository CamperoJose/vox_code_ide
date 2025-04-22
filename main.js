// main.js
const { app, BrowserWindow, ipcMain, dialog, webContents } = require('electron');
const path = require('path');
const fs   = require('fs-extra');
const prompt = require('electron-prompt');
const pty   = require('node-pty');
const os    = require('os');

const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient();

// ——————————————————————————————————
// VERIFICACIÓN DE CREDENCIALES
console.log('>> GOOGLE_APPLICATION_CREDENTIALS =', process.env.GOOGLE_APPLICATION_CREDENTIALS);
const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credsPath || !fs.existsSync(credsPath)) {
  console.error('❌ Credenciales no encontradas en', credsPath);
} else {
  console.log('✅ Credenciales listas en', credsPath);
}
// ——————————————————————————————————

// Detecta el shell según el sistema operativo
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

let ideWindow = null;
let terminalWebContents = null;

// Función para crear la ventana del IDE
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

  ideWindow.on('closed', () => {
    ideWindow = null;
  });

  ideWindow.webContents.on('did-attach-webview', (event, attachedWebContents) => {
    terminalWebContents = attachedWebContents;
    console.log('Terminal webContents attached:', terminalWebContents.id);
    // Mostrar prompt inmediatamente
    ptyProcess.write('\r');
  });
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId(process.execPath);
  }
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'icon.png'));
  }
  createIDEWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (ideWindow === null) createIDEWindow();
});

// Importación dinámica de electron-store (ESM)
let store;
(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store();
})();

// IPC: abrir carpeta y guardar ruta
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled) {
    const folderPath = result.filePaths[0];
    store.set('lastProjectPath', folderPath);
    ptyProcess.write(`cd "${folderPath}"\r`);
    ptyProcess.write('clear\r');
    return scanFolder(folderPath);
  }
});

// IPC: restaurar última ruta
ipcMain.handle('project:getLast', () => {
  const lastPath = store.get('lastProjectPath');
  if (lastPath) {
    ptyProcess.write(`cd "${lastPath}"\r`);
    ptyProcess.write('clear\r');
    return scanFolder(lastPath);
  }
  return null;
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

// IPC para manejo de archivos
ipcMain.handle('file:open', async (_, filePath) => {
  return fs.readFile(filePath, 'utf-8');
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
    inputAttrs: { type: 'text' },
    type: 'input'
  });
});

// Proceso pty para la terminal
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: {
    ...process.env,
    PS1: "\\[\\033[1;34m\\]\\u@\\h \\[\\033[1;32m\\]\\w\\[\\033[0m\\]\\$ "
  }
});

// Envío de datos al webview de la terminal
ptyProcess.on('data', data => {
  if (terminalWebContents) {
    terminalWebContents.send('terminal.incomingData', data);
  }
});

// Recepción de teclas desde el webview
ipcMain.on('terminal.keystroke', (_, key) => {
  ptyProcess.write(key);
});

// IPC: transcribir voz con Google Speech-to-Text
ipcMain.handle('voice:transcribe', async (_, audioBytes, mimeType) => {
  console.log('–––––––––––––––––––––––––––––––––');
  console.log('[Main] voice:transcribe invoked');
  console.log('[Main] mimeType:', mimeType);
  console.log('[Main] audioBytes length:', audioBytes.length);

  // Detectar encoding apropiado
  let encoding;
  if (!mimeType || mimeType.includes('opus'))      encoding = 'WEBM_OPUS';
  else if (mimeType.includes('ogg'))               encoding = 'OGG_OPUS';
  else if (mimeType.includes('wav'))               encoding = 'LINEAR16';
  else {
    console.warn('[Main] Tipo desconocido, asumiendo WEBM_OPUS');
    encoding = 'WEBM_OPUS';
  }
  console.log('[Main] usando encoding:', encoding);

  // Construir request
  const audioContent = Buffer.from(audioBytes).toString('base64');
  const request = {
    audio: { content: audioContent },
    config: {
      encoding,
      sampleRateHertz: 48000,
      languageCode: 'es-ES'
    }
  };
  console.log('[Main] request.config:', request.config);

  try {
    const [response] = await speechClient.recognize(request);
    console.log('[Main] Google response:', JSON.stringify(response, null, 2));

    const results = response.results || [];
    console.log('[Main] results count:', results.length);

    results.forEach((res, idx) => {
      console.log(`[Main] result #${idx}:`, JSON.stringify(res, null, 2));
      res.alternatives.forEach((alt, aIdx) => {
        console.log(`    alt[${aIdx}]: transcript="${alt.transcript}" confidence=${alt.confidence}`);
      });
    });

    const transcript = results
      .map(r => r.alternatives[0]?.transcript)
      .filter(Boolean)
      .join('\n');

    console.log('[Main] transcript final:', transcript);
    return transcript;
  } catch (err) {
    console.error('[Main] ERROR en recognize():', err);
    return '';
  }
});
