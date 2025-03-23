import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

// Define el tema CyberNeon IDE y loguea el proceso
console.log('[Theme] Definiendo tema "cyberNeon"...');
monaco.editor.defineTheme('cyberNeon', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'C0C5CE' },
    { token: 'comment', foreground: '7F848E', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'FF3CAC', fontStyle: 'bold' },
    { token: 'identifier', foreground: '00E5FF' },
    { token: 'number', foreground: '8AFF80' },
    { token: 'delimiter', foreground: 'E1E1E1' },
    { token: 'string', foreground: 'FFF281' },
    { token: 'operator', foreground: 'FF9A5C' },
  ],
  colors: {
    'editor.background': '#1A1D24',
    'editor.foreground': '#C0C5CE',
    'editorLineNumber.foreground': '#5E6673',
    'editorCursor.foreground': '#FF3CAC',
    'editor.selectionBackground': '#3E4451',
    'editor.lineHighlightBackground': '#282C34',
    'editorBracketMatch.background': '#FF3CAC40',
    'scrollbarSlider.background': '#FF3CAC60',
    'editorWhitespace.foreground': '#3A3A3A',
  }
});
console.log('[Theme] Tema "cyberNeon" definido correctamente.');

// Crear el editor Monaco y loguear sus opciones
const editor = monaco.editor.create(document.getElementById('editorContainer'), {
  value: '// 🚀 CyberNeon IDE 🚀\n\n// Abre un archivo para empezar a programar...',
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

// Variable global para la ruta del archivo actualmente abierto
let currentFilePath = null;

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

// Elementos del DOM para la gestión de archivos
const openFolderBtn = document.getElementById('open-folder');
const fileTree = document.getElementById('file-tree');

// Botón para abrir proyecto: se loguea el evento y la respuesta
openFolderBtn.onclick = async () => {
  console.log('[Folder] Botón "Abrir Proyecto" presionado.');
  const files = await window.electronAPI.openFolder();
  console.log('[Folder] Archivos obtenidos:', files);
  if (files) {
    fileTree.innerHTML = '';
    renderFileTree(files, fileTree);
    console.log('[Folder] Árbol de archivos renderizado.');
  } else {
    console.log('[Folder] No se obtuvo información de archivos.');
  }
};

// Al cargar la ventana, se intenta cargar el último proyecto abierto
window.addEventListener('DOMContentLoaded', async () => {
  console.log('[Init] DOMContentLoaded: Iniciando carga del último proyecto abierto...');
  const lastFiles = await window.electronAPI.getLastProject();
  console.log('[Init] Últimos archivos del proyecto:', lastFiles);
  if (lastFiles) {
    fileTree.innerHTML = '';
    renderFileTree(lastFiles, fileTree);
    console.log('[Init] Árbol de archivos actualizado con el último proyecto.');
  } else {
    console.log('[Init] No hay proyecto previo almacenado.');
  }
});

// Configurar botones para crear archivo/directorio
document.getElementById('new-file').onclick = createNewFile;
document.getElementById('new-dir').onclick = createNewDir;

// Función para crear un nuevo archivo
async function createNewFile() {
  console.log('[CreateFile] Solicitud para crear nuevo archivo iniciada.');
  const name = await window.electronAPI.prompt("Nombre del nuevo archivo:");
  console.log('[CreateFile] Respuesta del prompt:', name);
  if (!name) {
    console.log('[CreateFile] Cancelado por el usuario (nombre vacío).');
    return;
  }
  const currentFolder = await window.electronAPI.getLastProjectPath();
  console.log('[CreateFile] Carpeta actual del proyecto:', currentFolder);
  if (currentFolder) {
    const filePath = currentFolder + '/' + name;
    console.log('[CreateFile] Ruta del nuevo archivo:', filePath);
    await window.electronAPI.createFile(filePath);
    console.log('[CreateFile] Archivo creado exitosamente.');
    refreshFileTree();
  } else {
    console.log('[CreateFile] No se pudo obtener la carpeta actual del proyecto.');
  }
}

// Función para crear una nueva carpeta
async function createNewDir() {
  console.log('[CreateDir] Solicitud para crear nueva carpeta iniciada.');
  const name = await window.electronAPI.prompt("Nombre de la nueva carpeta:");
  console.log('[CreateDir] Respuesta del prompt:', name);
  if (!name) {
    console.log('[CreateDir] Cancelado por el usuario (nombre vacío).');
    return;
  }
  const currentFolder = await window.electronAPI.getLastProjectPath();
  console.log('[CreateDir] Carpeta actual del proyecto:', currentFolder);
  if (currentFolder) {
    const dirPath = currentFolder + '/' + name;
    console.log('[CreateDir] Ruta de la nueva carpeta:', dirPath);
    await window.electronAPI.createDirectory(dirPath);
    console.log('[CreateDir] Carpeta creada exitosamente.');
    refreshFileTree();
  } else {
    console.log('[CreateDir] No se pudo obtener la carpeta actual del proyecto.');
  }
}

// Función para refrescar el árbol de archivos
async function refreshFileTree() {
  console.log('[Refresh] Actualizando árbol de archivos...');
  const files = await window.electronAPI.getLastProject();
  console.log('[Refresh] Archivos obtenidos para refrescar:', files);
  if (files) {
    fileTree.innerHTML = '';
    renderFileTree(files, fileTree);
    console.log('[Refresh] Árbol de archivos refrescado.');
  } else {
    console.log('[Refresh] No se obtuvieron archivos para refrescar.');
  }
}

// Función para renderizar el árbol de archivos de manera recursiva
function renderFileTree(files, parent) {
  console.log('[RenderTree] Iniciando renderizado de árbol con', files.length, 'elementos.');
  files.forEach(file => {
    console.log('[RenderTree] Procesando:', file.name, '-', file.isDirectory ? 'Directorio' : 'Archivo');
    const li = document.createElement('li');
    li.classList.add(file.isDirectory ? 'folder' : 'file');

    // Flechas estilizadas Unicode (moderno y recto)
    const arrow = document.createElement('span');
    arrow.textContent = file.isDirectory ? '▸' : '';
    arrow.classList.add('arrow');

    // Iconos modernos para archivos y carpetas
    const icon = document.createElement('span');
    icon.textContent = file.isDirectory ? '🗂️' : '📝';
    icon.classList.add('icon');

    const name = document.createElement('span');
    name.textContent = file.name;
    name.classList.add('file-name');

    li.appendChild(arrow);
    li.appendChild(icon);
    li.appendChild(name);
    parent.appendChild(li);

    if (file.isDirectory) {
      const nestedUl = document.createElement('ul');
      nestedUl.classList.add('collapsed');
      parent.appendChild(nestedUl);

      li.onclick = (e) => {
        e.stopPropagation();
        const isCollapsed = nestedUl.classList.toggle('collapsed');
        arrow.textContent = isCollapsed ? '▸' : '▾'; // Flechas alineadas claramente
        arrow.classList.toggle('expanded', !isCollapsed);
        console.log(`[RenderTree] ${file.name} ${isCollapsed ? 'colapsado' : 'expandido'}.`);
      };

      renderFileTree(file.children, nestedUl);
    } else {
      li.onclick = async (e) => {
        e.stopPropagation();
        currentFilePath = file.path;
        console.log('[RenderTree] Seleccionado archivo:', file.path);
        document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');

        const content = await window.electronAPI.openFile(file.path);
        const language = detectLanguage(file.name);
        monaco.editor.setModelLanguage(editor.getModel(), language);
        editor.setValue(content);
        console.log('[RenderTree] Archivo cargado en editor:', file.path);
      };
    }
  });
  console.log('[RenderTree] Renderizado del árbol completado.');
}

// Función para detectar el lenguaje basado en la extensión del archivo
function detectLanguage(filename) {
  const ext = filename.split('.').pop();
  const languages = {
    js: 'javascript', py: 'python', java: 'java', html: 'html', css: 'css',
    json: 'json', md: 'markdown', txt: 'plaintext', ts: 'typescript',
    vue: 'html', cpp: 'cpp', c: 'csharp', rb: 'ruby', php: 'php'
  };
  const detectedLanguage = languages[ext] || 'plaintext';
  console.log(`[DetectLanguage] Archivo: ${filename} | Extensión: ${ext} | Lenguaje detectado: ${detectedLanguage}`);
  return detectedLanguage;
}
