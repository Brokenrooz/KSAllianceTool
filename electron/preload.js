const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kingshotAPI", {
    loadData: () => ipcRenderer.invoke("ks:loadData"),
    saveData: (data) => ipcRenderer.invoke("ks:saveData", data),
    dataPath: () => ipcRenderer.invoke("ks:dataPath")
});
