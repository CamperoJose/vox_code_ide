const fs = require('fs-extra');
const path = require('path');

function scanFolder(dirPath) {
  const items = fs.readdirSync(dirPath);
  return items
    .filter(item => !item.startsWith('.'))
    .map(item => {
      const itemPath = path.join(dirPath, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();
      return {
        name: item,
        path: itemPath,
        isDirectory,
        children: isDirectory ? scanFolder(itemPath) : []
      };
    });
}

async function readFile(filePath) {
  return fs.readFile(filePath, 'utf-8');
}

async function saveFile(filePath, content) {
  return fs.writeFile(filePath, content, 'utf-8');
}

async function createFile(filePath) {
  await fs.ensureFile(filePath);
  return true;
}

async function createDir(dirPath) {
  await fs.ensureDir(dirPath);
  return true;
}

module.exports = {
  scanFolder,
  readFile,
  saveFile,
  createFile,
  createDir
};
