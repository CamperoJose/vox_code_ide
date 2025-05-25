import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';
import { editor, setCurrentFilePath } from '../editor/editor.js';

// Ruta de la carpeta actualmente seleccionada
let selectedDirPath = null;
// Conjunto de rutas de carpetas expandidas
const expandedPaths = new Set();

window.addEventListener('DOMContentLoaded', () => {
  const openFolderBtn = document.getElementById('open-folder');
  const fileTree = document.getElementById('file-tree');

  if (!openFolderBtn || !fileTree) {
    console.error('[FileManager] Error: No se encontraron los elementos del DOM para la gestión de archivos.');
    return;
  }

  // Botón para abrir proyecto
  openFolderBtn.onclick = async () => {
    console.log('[Folder] Botón "Abrir Proyecto" presionado.');
    const files = await window.electronAPI.openFolder();
    if (files) {
      fileTree.innerHTML = '';
      selectedDirPath = null;       // reset selección
      expandedPaths.clear();        // limpiar expansiones previas
      const tree = compressTree(files);
      renderFileTree(tree, fileTree);
      console.log('[Folder] Árbol de archivos renderizado.');
    }
  };

  // Cargar último proyecto abierto
  (async () => {
    console.log('[Init] Iniciando carga del último proyecto abierto...');
    const lastFiles = await window.electronAPI.getLastProject();
    if (lastFiles) {
      fileTree.innerHTML = '';
      selectedDirPath = null;
      expandedPaths.clear();
      const tree = compressTree(lastFiles);
      renderFileTree(tree, fileTree);
      console.log('[Init] Árbol de archivos actualizado con el último proyecto.');
    }
  })();

  // Configurar botones para crear archivo y carpeta
  document.getElementById('new-file').onclick = createNewFile;
  document.getElementById('new-dir').onclick = createNewDir;
});

// Crear un nuevo archivo en la carpeta seleccionada o raíz
async function createNewFile(name) {
  if (!name) return console.log('[CreateFile] Cancelado (nombre vacío).');

  let target = selectedDirPath;
  if (!target) target = await window.electronAPI.getLastProjectPath();
  if (!target) return console.error('[CreateFile] No hay ruta válida.');

  const filePath = `${target}/${name}`;
  console.log('[CreateFile] Ruta:', filePath);
  await window.electronAPI.createFile(filePath);
  await refreshFileTree();
}

// Crear nueva carpeta en la carpeta seleccionada o raíz
async function createNewDir(name) {
  if (!name) return console.log('[CreateDir] Cancelado (nombre vacío).');

  let target = selectedDirPath;
  if (!target) target = await window.electronAPI.getLastProjectPath();
  if (!target) return console.error('[CreateDir] No hay ruta válida.');

  const dirPath = `${target}/${name}`;
  console.log('[CreateDir] Ruta:', dirPath);
  await window.electronAPI.createDirectory(dirPath);
  await refreshFileTree();
}

// Refrescar el árbol sin perder expansiones
async function refreshFileTree() {
  console.log('[Refresh] Actualizando árbol...');
  const fileTree = document.getElementById('file-tree');
  const files = await window.electronAPI.getLastProject();
  if (files) {
    fileTree.innerHTML = '';
    const tree = compressTree(files);
    renderFileTree(tree, fileTree);
    console.log('[Refresh] Árbol refrescado.');
  }
}

// Compacta secuencias de carpetas únicas
function compressTree(nodes) {
  return nodes.map(node => {
    if (!node.isDirectory) return node;

    let name = node.name;
    let children = node.children;

    while (children.length === 1 && children[0].isDirectory) {
      name = `${name}/${children[0].name}`;
      children = children[0].children;
    }

    return {
      ...node,
      name,
      children: compressTree(children)
    };
  });
}

// Renderizado recursivo con preservación de expansiones
function renderFileTree(files, parent) {
  files.forEach(file => {
    const li = document.createElement('li');
    li.classList.add(file.isDirectory ? 'folder' : 'file');
    li.dataset.path = file.path;

    // Flecha
    const arrow = document.createElement('span');
    arrow.textContent = file.isDirectory ? '▸' : '';
    arrow.classList.add('arrow');

    // Icono
    const icon = document.createElement('span');
    icon.textContent = file.isDirectory ? '🗂️' : '📝';
    icon.classList.add('icon');

    // Nombre
    const nameSpan = document.createElement('span');
    nameSpan.textContent = file.name;
    nameSpan.classList.add('file-name');

    li.append(arrow, icon, nameSpan);

    // Indicador si es carpeta seleccionada
    if (file.isDirectory && file.path === selectedDirPath) {
      const indicator = document.createElement('span');
      indicator.textContent = ' •';
      indicator.classList.add('indicator');
      nameSpan.appendChild(indicator);
    }

    parent.appendChild(li);

    if (file.isDirectory) {
      const nestedUl = document.createElement('ul');
      parent.appendChild(nestedUl);

      // Determinar estado inicial (expandido o colapsado)
      const isExpanded = expandedPaths.has(file.path);
      if (!isExpanded) {
        nestedUl.classList.add('collapsed');
        arrow.textContent = '▸';
      } else {
        arrow.textContent = '▾';
      }

      // Control de clic en carpeta
      li.onclick = (e) => {
        e.stopPropagation();

        const nowCollapsed = nestedUl.classList.toggle('collapsed');
        arrow.textContent = nowCollapsed ? '▸' : '▾';

        // Actualizar conjunto de rutas expandidas
        if (nowCollapsed) {
          expandedPaths.delete(file.path);
        } else {
          expandedPaths.add(file.path);
        }

        // Resaltar selección
        document.querySelectorAll('.indicator').forEach(i => i.remove());
        selectedDirPath = file.path;
        const indicator = document.createElement('span');
        indicator.textContent = ' •';
        indicator.classList.add('indicator');
        nameSpan.appendChild(indicator);
      };

      renderFileTree(file.children, nestedUl);

    } else {
      // Click en archivo
      li.onclick = async (e) => {
        e.stopPropagation();

        // Ajustar carpeta destino (padre del archivo)
        const parts = file.path.split('/');
        parts.pop();
        selectedDirPath = parts.join('/');

        // Actualizar indicador visual
        document.querySelectorAll('.indicator').forEach(i => i.remove());
        const parentLi = document.querySelector(`li[data-path="${selectedDirPath}"]`);
        if (parentLi) {
          const nameEl = parentLi.querySelector('.file-name');
          const indicator = document.createElement('span');
          indicator.textContent = ' •';
          indicator.classList.add('indicator');
          nameEl.appendChild(indicator);
        }

        setCurrentFilePath(file.path);
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

function detectLanguage(filename) {
  const ext = filename.split('.').pop();
  const map = {
    js: 'javascript', py: 'python', java: 'java', html: 'html', css: 'css',
    json: 'json', md: 'markdown', txt: 'plaintext', ts: 'typescript',
    vue: 'html', cpp: 'cpp', c: 'csharp', rb: 'ruby', php: 'php'
  };
  return map[ext] || 'plaintext';
}

export { createNewFile, createNewDir, refreshFileTree, renderFileTree, detectLanguage };
