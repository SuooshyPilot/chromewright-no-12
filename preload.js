const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('chromewright', {
    load: () => ipcRenderer.invoke('cw:load'),
    save: (data) => ipcRenderer.invoke('cw:save', data),
    saveAs: (text) => ipcRenderer.invoke('cw:save-as', text),
    open: () => ipcRenderer.invoke('cw:open'),
    setAutoLaunch: (enable) => ipcRenderer.invoke('cw:set-auto-launch', enable),
    getAutoLaunch: () => ipcRenderer.invoke('cw:get-auto-launch')
});
