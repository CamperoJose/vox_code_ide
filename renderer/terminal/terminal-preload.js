// terminal-preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("terminalAPI", {
  sendKeystroke: (data) => ipcRenderer.send("terminal.keystroke", data),
  onIncomingData: (callback) => ipcRenderer.on("terminal.incomingData", (event, data) => callback(data))
});
