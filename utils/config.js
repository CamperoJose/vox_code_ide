// utils/config.js

// Ya no usamos require, sino import() dinámico
async function initStore() {
  const { default: Store } = await import('electron-store');
  return new Store();
}

module.exports = { initStore };
