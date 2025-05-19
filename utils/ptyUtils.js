const pty = require('node-pty');
const os  = require('os');

function initTerminal(window) {
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
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

  let terminalWebContents = null;

  window.webContents.on('did-attach-webview', (_, attachedWebContents) => {
    terminalWebContents = attachedWebContents;
    ptyProcess.write('\r');
  });

  ptyProcess.on('data', data => {
    if (terminalWebContents) {
      terminalWebContents.send('terminal.incomingData', data);
    }
  });

  return { ptyProcess, terminalWebContents };
}

module.exports = { initTerminal };
