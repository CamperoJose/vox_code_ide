import { editor, monaco } from './editor/editor.js';
import './fileManager/fileManager.js';

// ==================== Utility ====================
/** UT001: showToast
 * Shows a transient notification toast.
 * @param {string} message - Text to display.
 * @param {boolean} [success=true] - True for success style, false for error.
 */
function showToast(message, success = true) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast' + (success ? '' : ' error');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}

// ==================== Terminal ====================
/** TM001: sendEnterToTerminal
 * Sends an Enter keystroke to the terminal.
 */
function sendEnterToTerminal() {
  window.electronAPI.sendToTerminal('\r');
}

/** TM002: sendPwdToTerminal
 * Sends 'pwd' command to display current path in terminal.
 */
function sendPwdToTerminal() {
  window.electronAPI.sendToTerminal('pwd\r');
}

/** TM003: initTerminalControls
 * Registers terminal control buttons.
 */
function initTerminalControls() {
  document.getElementById('insert-enter').addEventListener('click', sendEnterToTerminal);
  document.getElementById('show-path').addEventListener('click', sendPwdToTerminal);
}

// ==================== Code Editor ====================
/** EM001: setCursorLine
 * Moves cursor to the start of a specified line.
 * Prompts user for line number.
 */
async function setCursorLine() {
  const lineStr = await window.electronAPI.showPrompt('¿En qué línea colocar el cursor?');
  const line = parseInt(lineStr, 10);
  if (!isNaN(line) && line >= 1) {
    editor.setPosition({ lineNumber: line, column: 1 });
    editor.focus();
  }
}

/** EM002: selectLine
 * Selects an entire line in the editor.
 * Prompts user for line number.
 */
async function selectLine() {
  const lineStr = await window.electronAPI.showPrompt('¿Qué línea quieres seleccionar?');
  const line = parseInt(lineStr, 10);
  if (!isNaN(line) && line >= 1) {
    const maxCol = editor.getModel().getLineMaxColumn(line);
    editor.setSelection(new monaco.Range(line, 1, line, maxCol));
    editor.focus();
  }
}

/** EM003: selectRange
 * Selects a range of lines in the editor.
 * Prompts user for start and end lines.
 */
async function selectRange() {
  const fromStr = await window.electronAPI.showPrompt('Línea desde:');
  const toStr   = await window.electronAPI.showPrompt('Línea hasta:');
  const from = parseInt(fromStr, 10);
  const to   = parseInt(toStr, 10);
  if (!isNaN(from) && !isNaN(to) && from >= 1 && to >= from) {
    const maxCol = editor.getModel().getLineMaxColumn(to);
    editor.setSelection(new monaco.Range(from, 1, to, maxCol));
    editor.focus();
  }
}

/** EM004: insertSnippet
 * Inserts a code snippet at a specified line.
 * Prompts user for line number and snippet text.
 */
async function insertSnippet() {
  const lineStr = await window.electronAPI.showPrompt('¿En qué línea insertar?');
  const snippet = await window.electronAPI.showPrompt('Fragmento de código:');
  const line = parseInt(lineStr, 10);
  if (!isNaN(line) && line >= 1) {
    editor.executeEdits('insert-frag', [{
      range: new monaco.Range(line, 1, line, 1),
      text: snippet + '\n',
      forceMoveMarkers: true
    }]);
    editor.focus();
  }
}

/** EM005: deleteLine
 * Deletes a specified line from the editor.
 * Prompts user for line number.
 */
async function deleteLine() {
  const lineStr = await window.electronAPI.showPrompt('¿Qué línea eliminar?');
  const line = parseInt(lineStr, 10);
  if (!isNaN(line) && line >= 1) {
    editor.executeEdits('delete-line', [{
      range: new monaco.Range(line, 1, line + 1, 1),
      text: '',
      forceMoveMarkers: true
    }]);
    editor.focus();
  }
}

/** EM006: initEditorControls
 * Registers editor control buttons.
 */
function initEditorControls() {
  document.getElementById('btn-set-cursor').addEventListener('click', setCursorLine);
  document.getElementById('btn-select-line').addEventListener('click', selectLine);
  document.getElementById('btn-select-range').addEventListener('click', selectRange);
  document.getElementById('btn-insert-frag').addEventListener('click', insertSnippet);
  document.getElementById('btn-delete-line').addEventListener('click', deleteLine);
}

// ==================== File Manager ====================
/** FM001: openProject
 * Opens the project folder dialog.
 */
function openProject() {
  document.getElementById('open-folder').click();
}

/** FM002: refreshTree
 * Refreshes the file tree.
 */
function refreshTree() {
  document.getElementById('open-folder').click();
}

/** FM003: isVisible
 * Checks if a tree node is visible (not collapsed).
 * @param {HTMLElement} li - The <li> element to check.
 * @returns {boolean}
 */
function isVisible(li) {
  let el = li;
  while (el && el.id !== 'file-tree') {
    if (el.tagName === 'UL' && el.classList.contains('collapsed')) return false;
    el = el.parentElement;
  }
  return true;
}

/** FM004: openFolderByName
 * Opens a folder node in the tree by name.
 * @param {string} name - Folder name to match.
 * @returns {boolean}
 */
function openFolderByName(name) {
  name = name.trim().toLowerCase();
  const candidates = Array.from(document.querySelectorAll('li.folder')).filter(li => {
    const text = li.querySelector('.file-name').textContent.trim().toLowerCase();
    return text === name && isVisible(li);
  });
  if (candidates.length) {
    candidates[0].click();
    candidates[0].scrollIntoView({ block: 'center' });
    return true;
  }
  return false;
}

/** FM005: openFileByName
 * Opens a file in the tree by name, ignoring extension if omitted.
 * @param {string} name - File name or base name to match.
 * @returns {boolean}
 */
function openFileByName(name) {
  name = name.trim().toLowerCase();
  const candidates = Array.from(document.querySelectorAll('li.file')).filter(li => {
    let text = li.querySelector('.file-name').textContent.trim().toLowerCase();
    if (!name.includes('.')) {
      const base = text.includes('.') ? text.slice(0, text.lastIndexOf('.')) : text;
      return base === name && isVisible(li);
    }
    return text === name && isVisible(li);
  });
  if (candidates.length) {
    candidates[0].click();
    candidates[0].scrollIntoView({ block: 'center' });
    return true;
  }
  return false;
}

/** FM006: createFileInFolder
 * Prompts for a folder and new file name, then creates the file inside.
 */
async function createFileInFolder() {
  const folder = await window.electronAPI.showPrompt('Crear archivo en carpeta (nombre):');
  if (!folder) return;
  if (!openFolderByName(folder)) {
    showToast(`No se encontró la carpeta “${folder}”`, false);
    return;
  }
  document.getElementById('new-file').click();
}

/** FM007: createDirInFolder
 * Prompts for a folder and new directory name, then creates it inside.
 */
async function createDirInFolder() {
  const folder = await window.electronAPI.showPrompt('Crear carpeta en carpeta (nombre):');
  if (!folder) return;
  if (!openFolderByName(folder)) {
    showToast(`No se encontró la carpeta “${folder}”`, false);
    return;
  }
  document.getElementById('new-dir').click();
}

// ==================== Voice Panel Initialization ====================
/** VP000: initializeVoicePanel
 * Registers all event listeners for voice-panel controls.
 * Call after voicePanel.html is injected.
 */
function initializeVoicePanel() {
  initTerminalControls();
  initEditorControls();
  document.getElementById('voice-open-project').addEventListener('click', openProject);
  document.getElementById('voice-refresh-tree').addEventListener('click', refreshTree);
  // Simple new file/dir
  document.getElementById('voice-new-file').addEventListener('click', () => document.getElementById('new-file').click());
  document.getElementById('voice-new-dir').addEventListener('click', () => document.getElementById('new-dir').click());
  // Open specific
  document.getElementById('voice-open-folder').addEventListener('click', async () => {
    const name = await window.electronAPI.showPrompt('Nombre de la carpeta a abrir:');
    if (!name) return;
    const ok = openFolderByName(name);
    showToast(ok ? `Se abrió “${name}”` : `No se encontró “${name}”`, ok);
  });
  document.getElementById('voice-open-file').addEventListener('click', async () => {
    const name = await window.electronAPI.showPrompt('Nombre del archivo a abrir:');
    if (!name) return;
    const ok = openFileByName(name);
    showToast(ok ? `Se abrió “${name}”` : `No se encontró “${name}”`, ok);
  });
  // Create inside
  document.getElementById('voice-new-file-in').addEventListener('click', createFileInFolder);
  document.getElementById('voice-new-dir-in').addEventListener('click', createDirInFolder);
  window.initializeVoicePanel = initializeVoicePanel;

  
  const recordBtn = document.getElementById('voice-record');
  const transcriptDiv = document.getElementById('voice-transcript');
  let mediaRecorder, audioChunks = [];

  recordBtn.addEventListener('click', async () => {
    if (recordBtn.textContent === 'Grabar') {
      // iniciar grabación
      audioChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      recordBtn.textContent = 'Detener';

      mediaRecorder.addEventListener('dataavailable', e => audioChunks.push(e.data));
      mediaRecorder.addEventListener('stop', async () => {
        // combinar y convertir a ArrayBuffer
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        const arrayBuffer = await blob.arrayBuffer();
        // invocar al main para transcribir
        transcriptDiv.textContent = 'Transcribiendo…';
        const transcription = await window.electronAPI.transcribeVoice(new Uint8Array(arrayBuffer));
        transcriptDiv.textContent = transcription || '[no se detectó voz]';
      });

    } else {
      // detener grabación
      mediaRecorder.stop();
      recordBtn.textContent = 'Grabar';
    }
  });
}

// ==================== Initial Setup ====================
document.addEventListener('DOMContentLoaded', () => {
  initTerminalControls();
  initEditorControls();
  // After initial DOM, if voicePanel present, initialize
  if (typeof initializeVoicePanel === 'function') initializeVoicePanel();
});
