
async function initStore() {
  const { default: Store } = await import('electron-store');
  return new Store();
}

module.exports = { initStore };
