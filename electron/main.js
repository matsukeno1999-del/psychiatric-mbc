const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const db = require('./database.js')

const isDev = process.env.NODE_ENV === 'development'

function getDbPath() {
  if (isDev) {
    const dir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return path.join(dir, 'data.db')
  }
  const userData = app.getPath('userData')
  return path.join(userData, 'data.db')
}

let serveFiles = null
if (!isDev) {
  const _mod = require('electron-serve')
  const serve = _mod.default ?? _mod
  serveFiles = serve({ directory: path.join(__dirname, '../out') })
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: '精神科 MBC 管理システム',
    show: false,
  })

  win.once('ready-to-show', () => win.show())

  if (isDev) {
    win.loadURL('http://localhost:3000')
  } else {
    await serveFiles(win)
  }
}

// ─── IPC handlers ───────────────────────────────────────────────

ipcMain.handle('patients:getAll', () => {
  try { return { data: db.getAllPatients(), error: null } }
  catch (e) { return { data: null, error: { message: e.message } } }
})

ipcMain.handle('patients:get', (_, id) => {
  try {
    const p = db.getPatient(id)
    return p ? { data: p, error: null } : { data: null, error: { message: '患者が見つかりません' } }
  } catch (e) { return { data: null, error: { message: e.message } } }
})

ipcMain.handle('patients:create', (_, data) => db.createPatient(data))
ipcMain.handle('patients:update', (_, id, data) => db.updatePatient(id, data))
ipcMain.handle('patients:delete', (_, id) => db.deletePatient(id))

ipcMain.handle('assessments:getByPatient', (_, patientId) => db.getAssessmentsByPatient(patientId))
ipcMain.handle('assessments:getByScale', (_, scaleName) => db.getAssessmentsByScale(scaleName))
ipcMain.handle('assessments:getByPatients', (_, patientIds) => db.getAssessmentsByPatients(patientIds))
ipcMain.handle('assessments:create', (_, inserts) => db.createAssessments(inserts))
ipcMain.handle('assessments:get', (_, id) => db.getAssessment(id))
ipcMain.handle('assessments:update', (_, id, data) => db.updateAssessment(id, data))
ipcMain.handle('assessments:delete', (_, id) => db.deleteAssessment(id))

ipcMain.handle('backup:save', async () => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'データベースをバックアップ',
    defaultPath: `mbc-backup-${new Date().toISOString().split('T')[0]}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
  })
  if (canceled || !filePath) return { success: false }
  try {
    fs.copyFileSync(db.getDbPath(), filePath)
    return { success: true, path: filePath }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  db.init(getDbPath())
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
