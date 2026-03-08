const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendToAgent: (message) => ipcRenderer.invoke('send-to-agent', message),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, data) => callback(data)),
  checkForUpdates: () => ipcRenderer.send('check-for-updates')
});