// electron/preload.js
/**
 * Vibe Code Desktop - Preload Script
 * Secure bridge between main and renderer processes
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose safe API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Preferences
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreference: (key, value) => ipcRenderer.invoke('set-preference', key, value),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Dialogs
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  toggleMaximize: () => ipcRenderer.send('toggle-maximize'),
  closeWindow: () => ipcRenderer.send('close-window'),
  restartApp: () => ipcRenderer.send('restart-app'),

  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),

  // Platform info
  platform: process.platform,
  isDesktop: true,
});

// Log that preload is loaded
console.log('Vibe Code Desktop API loaded');
