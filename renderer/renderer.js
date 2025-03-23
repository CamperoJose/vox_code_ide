import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

// Define el tema CyberNeon IDE
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


let currentFilePath = null;

// Autoguardado
editor.onDidChangeModelContent(() => {
  if (currentFilePath) {
    clearTimeout(window.autosaveTimer);
    window.autosaveTimer = setTimeout(() => {
      window.electronAPI.saveFile(currentFilePath, editor.getValue());
    }, 5000);
  }
});

const openFolderBtn = document.getElementById('open-folder');
const fileTree = document.getElementById('file-tree');

openFolderBtn.onclick = async () => {
  const files = await window.electronAPI.openFolder();
  if(files){
    fileTree.innerHTML = '';
    renderFileTree(files, fileTree);
  }
};

// Al cargar, obtiene el último proyecto abierto
window.addEventListener('DOMContentLoaded', async () => {
  const lastFiles = await window.electronAPI.getLastProject();
  if (lastFiles) {
    fileTree.innerHTML = '';
    renderFileTree(lastFiles, fileTree);
  }
});

// Eventos botones crear archivo/directorio
document.getElementById('new-file').onclick = createNewFile;
document.getElementById('new-dir').onclick = createNewDir;

// Crear nuevo archivo
// Crear nuevo archivo
async function createNewFile() {
  const name = await window.electronAPI.prompt("Nombre del nuevo archivo:");
  if (!name) return;
  const currentFolder = await window.electronAPI.getLastProjectPath();
  if(currentFolder){
    const filePath = currentFolder + '/' + name;
    await window.electronAPI.createFile(filePath);
    refreshFileTree();
  }
}

// Crear nueva carpeta
async function createNewDir() {
  const name = await window.electronAPI.prompt("Nombre de la nueva carpeta:");
  if (!name) return;
  const currentFolder = await window.electronAPI.getLastProjectPath();
  if(currentFolder){
    const dirPath = currentFolder + '/' + name;
    await window.electronAPI.createDirectory(dirPath);
    refreshFileTree();
  }
}


// Refrescar árbol de archivos
async function refreshFileTree() {
  const files = await window.electronAPI.getLastProject();
  if(files){
    fileTree.innerHTML = '';
    renderFileTree(files, fileTree);
  }
}



function renderFileTree(files, parent) {
  files.forEach(file => {
    const li = document.createElement('li');
    li.classList.add(file.isDirectory ? 'folder' : 'file');

    // Flechas estilizadas Unicode (moderno y recto)
    const arrow = document.createElement('span');
    arrow.textContent = file.isDirectory ? '▸' : '';
    arrow.classList.add('arrow');

    // Iconos más modernos para archivos/carpetas
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
      };

      renderFileTree(file.children, nestedUl);
    } else {
      li.onclick = async (e) => {
        e.stopPropagation();
        currentFilePath = file.path;
        document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');

        const content = await window.electronAPI.openFile(file.path);
        const language = detectLanguage(file.name);
        monaco.editor.setModelLanguage(editor.getModel(), language);
        editor.setValue(content);
      };
    }
  });
}

// Detección del lenguaje
function detectLanguage(filename) {
  const ext = filename.split('.').pop();
  const languages = {
    js: 'javascript', py: 'python', java: 'java', html: 'html', css: 'css',
    json: 'json', md: 'markdown', txt: 'plaintext', ts: 'typescript',
    vue: 'html', cpp: 'cpp', c: 'csharp', rb: 'ruby', php: 'php'
  };
  return languages[ext] || 'plaintext';
}
