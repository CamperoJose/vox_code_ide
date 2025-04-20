import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';
import { editor, setCurrentFilePath } from '../editor/editor.js';

// Ejecutar todo cuando el DOM esté completamente cargado
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
    console.log('[Folder] Archivos obtenidos:', files);
    if (files) {
      fileTree.innerHTML = '';
      const tree = compressTree(files);
      renderFileTree(tree, fileTree);
      console.log('[Folder] Árbol de archivos renderizado.');
    }
  };

  // Cargar último proyecto abierto
  (async () => {
    console.log('[Init] Iniciando carga del último proyecto abierto...');
    const lastFiles = await window.electronAPI.getLastProject();
    console.log('[Init] Últimos archivos del proyecto:', lastFiles);
    if (lastFiles) {
      fileTree.innerHTML = '';
      const tree = compressTree(lastFiles);
      renderFileTree(tree, fileTree);
      console.log('[Init] Árbol de archivos actualizado con el último proyecto.');
    } else {
      console.log('[Init] No hay proyecto previo almacenado.');
    }
  })();

  // Configurar botones para crear archivo y carpeta
  document.getElementById('new-file').onclick = createNewFile;
  document.getElementById('new-dir').onclick = createNewDir;
});

// Función para crear un nuevo archivo
async function createNewFile() {
  console.log('[CreateFile] Solicitud para crear nuevo archivo iniciada.');
  const name = await window.electronAPI.prompt("Nombre del nuevo archivo:");
  console.log('[CreateFile] Respuesta del prompt:', name);
  if (!name) return console.log('[CreateFile] Cancelado por el usuario (nombre vacío).');

  const currentFolder = await window.electronAPI.getLastProjectPath();
  console.log('[CreateFile] Carpeta actual del proyecto:', currentFolder);
  if (currentFolder) {
    const filePath = `${currentFolder}/${name}`;
    console.log('[CreateFile] Ruta del nuevo archivo:', filePath);
    await window.electronAPI.createFile(filePath);
    console.log('[CreateFile] Archivo creado exitosamente.');
    await refreshFileTree();
  } else {
    console.log('[CreateFile] No se pudo obtener la carpeta actual del proyecto.');
  }
}

// Función para crear una nueva carpeta
async function createNewDir() {
  console.log('[CreateDir] Solicitud para crear nueva carpeta iniciada.');
  const name = await window.electronAPI.prompt("Nombre de la nueva carpeta:");
  console.log('[CreateDir] Respuesta del prompt:', name);
  if (!name) return console.log('[CreateDir] Cancelado por el usuario (nombre vacío).');

  const currentFolder = await window.electronAPI.getLastProjectPath();
  console.log('[CreateDir] Carpeta actual del proyecto:', currentFolder);
  if (currentFolder) {
    const dirPath = `${currentFolder}/${name}`;
    console.log('[CreateDir] Ruta de la nueva carpeta:', dirPath);
    await window.electronAPI.createDirectory(dirPath);
    console.log('[CreateDir] Carpeta creada exitosamente.');
    await refreshFileTree();
  } else {
    console.log('[CreateDir] No se pudo obtener la carpeta actual del proyecto.');
  }
}

// Función para refrescar el árbol de archivos
async function refreshFileTree() {
  console.log('[Refresh] Actualizando árbol de archivos...');
  const fileTree = document.getElementById('file-tree');
  const files = await window.electronAPI.getLastProject();
  console.log('[Refresh] Archivos obtenidos para refrescar:', files);
  if (files) {
    fileTree.innerHTML = '';
    const tree = compressTree(files);
    renderFileTree(tree, fileTree);
    console.log('[Refresh] Árbol de archivos refrescado.');
  } else {
    console.log('[Refresh] No se obtuvieron archivos para refrescar.');
  }
}

/**
 * Comprime secuencias de carpetas únicas en una sola rama.
 * - Si un directorio tiene exactamente un único hijo que también es directorio,
 *   concatena sus nombres con "/" y avanza hasta que haya ramificaciones o archivos.
 */
function compressTree(nodes) {
  return nodes.map(node => {
    if (!node.isDirectory) return node;

    let name = node.name;
    let children = node.children;

    // Mientras haya un único hijo y sea carpeta, seguimos comprimiendo
    while (
      children.length === 1 &&
      children[0].isDirectory
    ) {
      name = `${name}/${children[0].name}`;
      children = children[0].children;
    }

    // Aplicar recursivamente a los hijos
    return {
      ...node,
      name,
      children: compressTree(children)
    };
  });
}

// Función para renderizar el árbol de archivos de forma recursiva
function renderFileTree(files, parent) {
  console.log('[RenderTree] Iniciando renderizado de árbol con', files.length, 'elementos.');
  files.forEach(file => {
    console.log('[RenderTree] Procesando:', file.name, '-', file.isDirectory ? 'Directorio' : 'Archivo');
    const li = document.createElement('li');
    li.classList.add(file.isDirectory ? 'folder' : 'file');

    // Flechas estilizadas Unicode
    const arrow = document.createElement('span');
    arrow.textContent = file.isDirectory ? '▸' : '';
    arrow.classList.add('arrow');

    // Iconos para archivos y carpetas
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
        arrow.textContent = isCollapsed ? '▸' : '▾';
        arrow.classList.toggle('expanded', !isCollapsed);
        console.log(`[RenderTree] ${file.name} ${isCollapsed ? 'colapsado' : 'expandido'}.`);
      };

      renderFileTree(file.children, nestedUl);

    } else {
      li.onclick = async (e) => {
        e.stopPropagation();
        setCurrentFilePath(file.path);
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

export { createNewFile, createNewDir, refreshFileTree, renderFileTree, detectLanguage };
