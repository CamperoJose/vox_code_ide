import { editor, monaco } from './editor/editor.js';
import './fileManager/fileManager.js';

// ==================== Utility ====================
/** UT001: showToast
 * Shows a transient notification toast.
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
async function setCursorLine() {
  const lineStr = await window.electronAPI.showPrompt('¿En qué línea colocar el cursor?');
  const line = parseInt(lineStr, 10);
  if (!isNaN(line) && line >= 1) {
    editor.setPosition({ lineNumber: line, column: 1 });
    editor.focus();
  }
}

async function selectLine() {
  const lineStr = await window.electronAPI.showPrompt('¿Qué línea quieres seleccionar?');
  const line = parseInt(lineStr, 10);
  if (!isNaN(line) && line >= 1) {
    const maxCol = editor.getModel().getLineMaxColumn(line);
    editor.setSelection(new monaco.Range(line, 1, line, maxCol));
    editor.focus();
  }
}

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

function initEditorControls() {
  document.getElementById('btn-set-cursor').addEventListener('click', setCursorLine);
  document.getElementById('btn-select-line').addEventListener('click', selectLine);
  document.getElementById('btn-select-range').addEventListener('click', selectRange);
  document.getElementById('btn-insert-frag').addEventListener('click', insertSnippet);
  document.getElementById('btn-delete-line').addEventListener('click', deleteLine);
}

// ==================== File Manager ====================
function openProject() {
  document.getElementById('open-folder').click();
}

function refreshTree() {
  document.getElementById('open-folder').click();
}

function isVisible(li) {
  let el = li;
  while (el && el.id !== 'file-tree') {
    if (el.tagName === 'UL' && el.classList.contains('collapsed')) return false;
    el = el.parentElement;
  }
  return true;
}

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

async function createFileInFolder() {
  const folder = await window.electronAPI.showPrompt('Crear archivo en carpeta (nombre):');
  if (!folder) return;
  if (!openFolderByName(folder)) {
    showToast(`No se encontró la carpeta “${folder}”`, false);
    return;
  }
  document.getElementById('new-file').click();
}

async function createDirInFolder() {
  const folder = await window.electronAPI.showPrompt('Crear carpeta en carpeta (nombre):');
  if (!folder) return;
  if (!openFolderByName(folder)) {
    showToast(`No se encontró la carpeta “${folder}”`, false);
    return;
  }
  document.getElementById('new-dir').click();
}

// ==================== Voice Helpers ====================
/** Normalize text: lowercase, remove accents & non-alphanumeric */
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

// ==================== Voice Panel Initialization ====================
function initializeVoicePanel() {
  initTerminalControls();
  initEditorControls();

  document.getElementById('voice-open-project').addEventListener('click', openProject);
  document.getElementById('voice-refresh-tree').addEventListener('click', refreshTree);
  document.getElementById('voice-new-file').addEventListener('click', () => document.getElementById('new-file').click());
  document.getElementById('voice-new-dir').addEventListener('click', () => document.getElementById('new-dir').click());
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
  document.getElementById('voice-new-file-in').addEventListener('click', createFileInFolder);
  document.getElementById('voice-new-dir-in').addEventListener('click', createDirInFolder);

  const recordBtn     = document.getElementById('voice-record');
  const transcriptDiv = document.getElementById('voice-transcript');
  const playback      = document.getElementById('voice-playback');
  let mediaRecorder, audioChunks = [];

  recordBtn.addEventListener('click', async () => {
    console.log('[Voice] click en botón:', recordBtn.textContent);

    if (recordBtn.textContent === 'Grabar') {
      audioChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Force WebM/Opus if supported
      const desiredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : '';
      const options = desiredMime ? { mimeType: desiredMime } : undefined;
      mediaRecorder = options
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);

      console.log('[Voice] MediaRecorder mimeType:', mediaRecorder.mimeType);
      mediaRecorder.start();
      recordBtn.textContent = 'Detener';

      mediaRecorder.addEventListener('dataavailable', e => {
        console.log('[Voice] dataavailable – size:', e.data.size, 'type:', e.data.type);
        audioChunks.push(e.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        console.log('[Voice] stop – chunks:', audioChunks.length);
        const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        console.log('[Voice] Blob – size:', blob.size, 'type:', blob.type);

        // Playback
        const url = URL.createObjectURL(blob);
        playback.src = url;
        try { await playback.play(); console.log('[Voice] playing audio'); } catch {}

        // Transcription
        const arrayBuffer = await blob.arrayBuffer();
        transcriptDiv.textContent = 'Transcribiendo…';
        const transcription = await window.electronAPI.transcribeVoice(
          new Uint8Array(arrayBuffer),
          blob.type
        );
        console.log('[Voice] Transcripción recibida:', transcription);

     // ———> LLAMADA AL BACKEND CHAT GPT con fetch
     var summaryResponse = "";
     try {
       const res = await fetch('http://localhost:8080/chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message: transcription })
       });
       if (!res.ok) throw new Error(`HTTP ${res.status}`);
       const { match, allParams, functionKey, groupKey, outParams, summary } = await res.json();

       console.log('--- ChatGPT Response ---');
       console.log('match:',       match);
       console.log('allParams:',   allParams);
       console.log('functionKey:', functionKey);
       console.log('groupKey:',    groupKey);
       console.log('outParams:',   outParams);
       console.log('summary:',     summary);

       // Sólo mostramos el summary como toast por ahora
       showToast(summary);
       summaryResponse = summary;
     } catch (err) {
       console.error('Error calling /chat endpoint:', err);
       showToast('Error al consultar ChatGPT', false);
     }
     // <—— FIN LLAMADA BACKEND

      transcriptDiv.textContent = summaryResponse || '[no se detectó voz]';
      recordBtn.textContent = 'Grabar';

        // Command detection
        const norm = normalize(transcription);

        if (norm === 'enter en la terminal') {
            sendEnterToTerminal();
          }
          else if (norm === 'ver ruta en la terminal') {
            console.log('[Voice] detected command: ver ruta en la terminal');
            sendPwdToTerminal();
          }

        recordBtn.textContent = 'Grabar';
      });

    } else {
      console.log('[Voice] stopping');
      mediaRecorder.stop();
    }
  });
}

// ==================== Initial Setup ====================
document.addEventListener('DOMContentLoaded', () => {
  initTerminalControls();
  initEditorControls();
  if (typeof initializeVoicePanel === 'function') initializeVoicePanel();
});
