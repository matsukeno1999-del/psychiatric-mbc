const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

let _db = null
let _dbPath = null

function init(dbPath) {
  _dbPath = dbPath
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  _db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      anonymous_code TEXT NOT NULL UNIQUE,
      diagnosis TEXT,
      notes TEXT,
      age INTEGER,
      gender TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      scale_name TEXT NOT NULL,
      scores TEXT NOT NULL,
      total_score INTEGER NOT NULL,
      assessed_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
  `)
}

function getDbPath() { return _dbPath }

function uuid() { return crypto.randomUUID() }

function parseAssessment(row) {
  return { ...row, scores: JSON.parse(row.scores) }
}

// Patients
function getAllPatients() {
  return _db.prepare('SELECT * FROM patients ORDER BY created_at DESC').all()
}

function getPatient(id) {
  return _db.prepare('SELECT * FROM patients WHERE id = ?').get(id) ?? null
}

function createPatient(data) {
  const id = uuid()
  try {
    _db.prepare(
      'INSERT INTO patients (id, anonymous_code, diagnosis, notes, age, gender) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, data.anonymous_code, data.diagnosis ?? null, data.notes ?? null, data.age ?? null, data.gender ?? null)
    return { data: _db.prepare('SELECT * FROM patients WHERE id = ?').get(id), error: null }
  } catch (e) {
    return { data: null, error: { message: e.message } }
  }
}

function updatePatient(id, data) {
  try {
    _db.prepare(
      'UPDATE patients SET anonymous_code=?, diagnosis=?, notes=?, age=?, gender=? WHERE id=?'
    ).run(data.anonymous_code, data.diagnosis ?? null, data.notes ?? null, data.age ?? null, data.gender ?? null, id)
    return { data: _db.prepare('SELECT * FROM patients WHERE id = ?').get(id), error: null }
  } catch (e) {
    return { data: null, error: { message: e.message } }
  }
}

function deletePatient(id) {
  try {
    _db.prepare('DELETE FROM patients WHERE id = ?').run(id)
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: { message: e.message } }
  }
}

// Assessments
function getAssessmentsByPatient(patientId) {
  const rows = _db.prepare(
    'SELECT * FROM assessments WHERE patient_id = ? ORDER BY assessed_at DESC'
  ).all(patientId)
  return { data: rows.map(parseAssessment), error: null }
}

function getAssessmentsByScale(scaleName) {
  const rows = _db.prepare(
    'SELECT * FROM assessments WHERE scale_name = ? ORDER BY assessed_at ASC'
  ).all(scaleName)
  return { data: rows.map(parseAssessment), error: null }
}

function getAssessmentsByPatients(patientIds) {
  if (patientIds.length === 0) return { data: [], error: null }
  const placeholders = patientIds.map(() => '?').join(',')
  const rows = _db.prepare(
    `SELECT * FROM assessments WHERE patient_id IN (${placeholders}) ORDER BY assessed_at ASC`
  ).all(...patientIds)
  return { data: rows.map(parseAssessment), error: null }
}

function createAssessments(inserts) {
  try {
    const stmt = _db.prepare(
      'INSERT INTO assessments (id, patient_id, scale_name, scores, total_score, assessed_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    const insertMany = _db.transaction((rows) => {
      for (const r of rows) {
        stmt.run(uuid(), r.patient_id, r.scale_name, JSON.stringify(r.scores), r.total_score, r.assessed_at, r.notes ?? null)
      }
    })
    insertMany(inserts)
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: { message: e.message } }
  }
}

function getAssessment(id) {
  const row = _db.prepare('SELECT * FROM assessments WHERE id = ?').get(id) ?? null
  if (!row) return { data: null, error: { message: '評価が見つかりません' } }
  return { data: parseAssessment(row), error: null }
}

function updateAssessment(id, data) {
  try {
    _db.prepare(
      'UPDATE assessments SET scores=?, total_score=?, assessed_at=?, notes=? WHERE id=?'
    ).run(JSON.stringify(data.scores), data.total_score, data.assessed_at, data.notes ?? null, id)
    const row = _db.prepare('SELECT * FROM assessments WHERE id = ?').get(id)
    return { data: row ? parseAssessment(row) : null, error: null }
  } catch (e) {
    return { data: null, error: { message: e.message } }
  }
}

function deleteAssessment(id) {
  try {
    _db.prepare('DELETE FROM assessments WHERE id = ?').run(id)
    return { data: null, error: null }
  } catch (e) {
    return { data: null, error: { message: e.message } }
  }
}

module.exports = {
  init,
  getDbPath,
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getAssessmentsByPatient,
  getAssessmentsByScale,
  getAssessmentsByPatients,
  createAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
}
