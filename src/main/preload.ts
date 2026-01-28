import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// APIs without exposing the entire Node.js API
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any Electron APIs needed here if required
});
