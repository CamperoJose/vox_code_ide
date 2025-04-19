// Importar módulos de editor y gestión de archivos.
import './editor/editor.js';
import './fileManager/fileManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnEnter = document.getElementById('insert-enter');
    const btnPath  = document.getElementById('show-path');
  
    // Enviar solo "Enter" (retorno de carro)
    btnEnter.addEventListener('click', () => {
      window.electronAPI.sendToTerminal('\r');
    });
  
    // Enviar "pmd" seguido de Enter
    btnPath.addEventListener('click', () => {
      window.electronAPI.sendToTerminal('ls\r');
    });
  });