const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  
  // Get installed mods
  getInstalledMods: () => ipcRenderer.invoke('get-installed-mods'),
  
  // Launch server with mods
  launchServer: (data) => ipcRenderer.invoke('launch-server', data),
  
  // Subscribe to Steam Workshop mods
  subscribeToMods: (data) => ipcRenderer.invoke('subscribe-to-mods', data),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Auth
  getAuthToken: () => ipcRenderer.invoke('get-auth-token'),
  getAuthUser: () => ipcRenderer.invoke('get-auth-user'),
  openLogin: () => ipcRenderer.invoke('open-login'),
  logout: () => ipcRenderer.invoke('logout'),
  
  // Listen for desktop ready event
  onDesktopReady: (callback) => {
    ipcRenderer.on('desktop-ready', (event, data) => callback(data));
  },
  
  // Listen for auth success event
  onAuthSuccess: (callback) => {
    ipcRenderer.on('auth-success', (event, data) => callback(data));
  },
  
  // Listen for deep link join event (from web browser)
  onDeepLinkJoin: (callback) => {
    ipcRenderer.on('deep-link-join', (event, data) => callback(data));
  }
});
