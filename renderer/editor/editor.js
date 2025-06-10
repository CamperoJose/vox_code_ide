import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

// Definir el tema CyberNeon IDE y loguear el proceso
console.log('[Theme] Definiendo tema "cyberNeon"...');
monaco.editor.defineTheme('cyberNeon', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'C0C5CE' },
    { token: 'comment', foreground: '7F848E', fontStyle: 'italic' },
    { token: 'keyword', foreground: '8E2DE2', fontStyle: 'bold' },
    { token: 'identifier', foreground: '74B9FF' },
    { token: 'number', foreground: '8AFF80' },
    { token: 'delimiter', foreground: 'E1E1E1' },
    { token: 'string', foreground: 'FFF281' },
    { token: 'operator', foreground: 'F8C555' },
  ],
  colors: {
    'editor.background': '#1A1D24',
    'editor.foreground': '#C0C5CE',
    'editorLineNumber.foreground': '#5E6673',
    'editorCursor.foreground': '#8E2DE2',
    'editor.selectionBackground': '#3E4451',
    'editor.lineHighlightBackground': '#2C2F36',
    'editorBracketMatch.background': '#8E2DE240',
    'scrollbarSlider.background': '#8E2DE260',
    'editorWhitespace.foreground': '#3A3A3A',
  }
});
console.log('[Theme] Tema "cyberNeon" definido correctamente.');

// Asegurarse de que el DOM esté listo para obtener "editorContainer"
const container = document.getElementById('editorContainer');
if (!container) {
  console.error('[Editor] Error: No se encontró el contenedor "editorContainer".');
}

// Crear la instancia de Monaco Editor
export const editor = monaco.editor.create(container, {
  value: '// 🚀 VoxCode IDE 🚀\n\n// Abre un archivo para empezar a programar...',
  language: 'javascript',
  theme: 'cyberNeon',
  automaticLayout: true,
  fontFamily: '"JetBrains Mono", monospace',
  fontLigatures: true,
  fontSize: 15,
  lineHeight: 24,
  cursorBlinking: 'phase',
  smoothScrolling: true,
  minimap: { enabled: false },
  renderWhitespace: 'selection',
  scrollbar: {
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8
  }
});
console.log('[Editor] Editor Monaco creado con tema "cyberNeon".');

// Exponer monaco para poder importarlo desde otros módulos
export { monaco };

// Variable global para la ruta del archivo actualmente abierto
let currentFilePath = null;
export function setCurrentFilePath(path) {
  currentFilePath = path;
  console.log(`[Editor] Ruta actual del archivo establecida en: ${currentFilePath}`);
}
export function getCurrentFilePath() {
  return currentFilePath;
}

// Autoguardado: se dispara cuando hay cambios en el contenido
editor.onDidChangeModelContent(() => {
  console.log('[Editor] Detectado cambio en el contenido del editor.');
  if (currentFilePath) {
    console.log(`[AutoSave] Archivo actual: ${currentFilePath}. Programando autoguardado...`);
    clearTimeout(window.autosaveTimer);
    window.autosaveTimer = setTimeout(() => {
      console.log(`[AutoSave] Guardando archivo: ${currentFilePath}`);
      window.electronAPI.saveFile(currentFilePath, editor.getValue());
    }, 5000);
  } else {
    console.log('[AutoSave] No hay archivo activo para guardar.');
  }
});
