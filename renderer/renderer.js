// Importar el editor y monaco desde editor.js
import { editor, monaco } from './editor/editor.js';
import './fileManager/fileManager.js';

document.addEventListener('DOMContentLoaded', () => {
  // ————— Terminal —————
  const btnEnter = document.getElementById('insert-enter');
  const btnPath  = document.getElementById('show-path');

  btnEnter.addEventListener('click', () => {
    window.electronAPI.sendToTerminal('\r');
  });

  btnPath.addEventListener('click', () => {
    window.electronAPI.sendToTerminal('pmd\r');
  });

  // ————— Editor —————
  const btnSetCursor   = document.getElementById('btn-set-cursor');
  const btnSelectLine  = document.getElementById('btn-select-line');
  const btnSelectRange = document.getElementById('btn-select-range');
  const btnInsertFrag  = document.getElementById('btn-insert-frag');
  const btnDeleteLine  = document.getElementById('btn-delete-line');

  // 1) Poner cursor al comienzo de una línea
  btnSetCursor.addEventListener('click', async () => {
    const lineStr = await window.electronAPI.showPrompt('¿En qué línea colocar el cursor?');
    const line = parseInt(lineStr, 10);
    if (!isNaN(line) && line >= 1) {
      editor.setPosition({ lineNumber: line, column: 1 });
      editor.focus();
    }
  });

  // 2) Seleccionar toda una línea
  btnSelectLine.addEventListener('click', async () => {
    const lineStr = await window.electronAPI.showPrompt('¿Qué línea quieres seleccionar?');
    const line = parseInt(lineStr, 10);
    if (!isNaN(line) && line >= 1) {
      const maxCol = editor.getModel().getLineMaxColumn(line);
      editor.setSelection(new monaco.Range(line, 1, line, maxCol));
      editor.focus();
    }
  });

  // 3) Seleccionar un rango de líneas
  btnSelectRange.addEventListener('click', async () => {
    const fromStr = await window.electronAPI.showPrompt('Línea desde:');
    const toStr   = await window.electronAPI.showPrompt('Línea hasta:');
    const from = parseInt(fromStr, 10);
    const to   = parseInt(toStr, 10);
    if (!isNaN(from) && !isNaN(to) && from >= 1 && to >= from) {
      const maxCol = editor.getModel().getLineMaxColumn(to);
      editor.setSelection(new monaco.Range(from, 1, to, maxCol));
      editor.focus();
    }
  });

  // 4) Insertar fragmento de código en una línea
  btnInsertFrag.addEventListener('click', async () => {
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
  });

  // 5) Eliminar una línea
  btnDeleteLine.addEventListener('click', async () => {
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
  });
});
