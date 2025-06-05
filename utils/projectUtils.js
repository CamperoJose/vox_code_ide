const { scanFolder, readFile, saveFile, createFile, createDir } = require('./fileUtils');
const prompt = require('electron-prompt');
const { createSpeechClient } = require('./speechUtils');

function setupIpcHandlers(ipcMain, dialog, store, ptyProcess) {
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

  ipcMain.handle('project:getLast', () => {
    const lastPath = store.get('lastProjectPath');
    if (lastPath) {
      ptyProcess.write(`cd "${lastPath}"\r`);
      ptyProcess.write('clear\r');
      return scanFolder(lastPath);
    }
    return null;
  });

  ipcMain.handle('file:open', (_, filePath) => readFile(filePath));
  ipcMain.handle('file:create', (_, filePath) => createFile(filePath));
  ipcMain.handle('directory:create', (_, dirPath) => createDir(dirPath));
  ipcMain.handle('file:save', (_, filePath, content) => saveFile(filePath, content));
  ipcMain.handle('get:lastProjectPath', () => store.get('lastProjectPath'));
  ipcMain.handle('prompt:show', (_, message) => prompt({
    title: 'VoxCode IDE',
    label: message,
    inputAttrs: { type: 'text' },
    type: 'input'
  }));

  ipcMain.on('terminal.keystroke', (_, key) => ptyProcess.write(key));

  ipcMain.handle('voice:transcribe', async (_, audioBytes, mimeType) => {
    const speechClient = createSpeechClient();
    const audioContent = Buffer.from(audioBytes).toString('base64');
    const request = {
      audio: { content: audioContent },
      config: {
        encoding: mimeType.includes('wav') ? 'LINEAR16' : 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'es-ES',
        alternativeLanguageCodes: ['en-US'],
        enableAutomaticPunctuation: true,
        model: 'latest_long',
        useEnhanced: true,
        speechContexts: [{ phrases: ['abrir terminal', 'ejecutar build'] }]
      }
    };

    try {
      const [response] = await speechClient.recognize(request);
      return response.results.map(r => r.alternatives[0]?.transcript).filter(Boolean).join('\n');
    } catch (err) {
      console.error(err);
      return '';
    }
  });
}

module.exports = { setupIpcHandlers };
