const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  patients: {
    getAll: () => ipcRenderer.invoke('patients:getAll'),
    get: (id) => ipcRenderer.invoke('patients:get', id),
    create: (data) => ipcRenderer.invoke('patients:create', data),
    update: (id, data) => ipcRenderer.invoke('patients:update', id, data),
    delete: (id) => ipcRenderer.invoke('patients:delete', id),
  },
  assessments: {
    getByPatient: (patientId) => ipcRenderer.invoke('assessments:getByPatient', patientId),
    getByScale: (scaleName) => ipcRenderer.invoke('assessments:getByScale', scaleName),
    getByPatients: (patientIds) => ipcRenderer.invoke('assessments:getByPatients', patientIds),
    create: (inserts) => ipcRenderer.invoke('assessments:create', inserts),
    get: (id) => ipcRenderer.invoke('assessments:get', id),
    update: (id, data) => ipcRenderer.invoke('assessments:update', id, data),
    delete: (id) => ipcRenderer.invoke('assessments:delete', id),
  },
  backup: {
    save: () => ipcRenderer.invoke('backup:save'),
  },
})
