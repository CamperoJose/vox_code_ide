const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    openFile: (filePath) => ipcRenderer.invoke('file:open', filePath),
    getLastProject: () => ipcRenderer.invoke('project:getLast'),
    getLastProjectPath: () => ipcRenderer.invoke('get:lastProjectPath'),
    saveFile: (path, content) => ipcRenderer.invoke('file:save', path, content),
    createFile: (path) => ipcRenderer.invoke('file:create', path),
    createDirectory: (path) => ipcRenderer.invoke('directory:create', path),
    prompt: (message) => ipcRenderer.invoke('prompt:show', message),

    sendToTerminal: (data) => ipcRenderer.send('terminal.keystroke', data)

  });
  