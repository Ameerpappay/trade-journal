const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getTrades: () => ipcRenderer.invoke('get-trades'),
    addTrade: (trade, imagePaths, tagIds) => ipcRenderer.invoke('add-trade', trade, imagePaths, tagIds),
    getTags: () => ipcRenderer.invoke('get-tags'),
    addTag: (name) => ipcRenderer.invoke('add-tag', name),
    deleteTag: (id) => ipcRenderer.invoke('delete-tag', id),
    getStrategies: () => ipcRenderer.invoke('get-strategies'),
    addStrategy: (name) => ipcRenderer.invoke('add-strategy', name),
    deleteStrategy: (id) => ipcRenderer.invoke('delete-strategy', id)
});