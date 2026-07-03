import type { Patient, Assessment } from './types'

type PatientCreate = Omit<Patient, 'id' | 'created_at'>
type AssessmentCreate = Omit<Assessment, 'id' | 'created_at'>
type AssessmentUpdate = Pick<Assessment, 'scores' | 'total_score' | 'assessed_at' | 'notes'>

interface DbResponse<T> {
  data: T | null
  error: { message: string } | null
}

interface BackupResult {
  success: boolean
  path?: string
  error?: string
}

interface ElectronAPI {
  patients: {
    getAll: () => Promise<DbResponse<Patient[]>>
    get: (id: string) => Promise<DbResponse<Patient>>
    create: (data: PatientCreate) => Promise<DbResponse<Patient>>
    update: (id: string, data: PatientCreate) => Promise<DbResponse<Patient>>
    delete: (id: string) => Promise<DbResponse<null>>
  }
  assessments: {
    getByPatient: (patientId: string) => Promise<DbResponse<Assessment[]>>
    getByScale: (scaleName: string) => Promise<DbResponse<Assessment[]>>
    getByPatients: (patientIds: string[]) => Promise<DbResponse<Assessment[]>>
    create: (inserts: AssessmentCreate[]) => Promise<DbResponse<null>>
    get: (id: string) => Promise<DbResponse<Assessment>>
    update: (id: string, data: AssessmentUpdate) => Promise<DbResponse<Assessment>>
    delete: (id: string) => Promise<DbResponse<null>>
  }
  backup: {
    save: () => Promise<BackupResult>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export const api: ElectronAPI = {
  patients: {
    getAll: () => window.electronAPI.patients.getAll(),
    get: (id) => window.electronAPI.patients.get(id),
    create: (data) => window.electronAPI.patients.create(data),
    update: (id, data) => window.electronAPI.patients.update(id, data),
    delete: (id) => window.electronAPI.patients.delete(id),
  },
  assessments: {
    getByPatient: (patientId) => window.electronAPI.assessments.getByPatient(patientId),
    getByScale: (scaleName) => window.electronAPI.assessments.getByScale(scaleName),
    getByPatients: (patientIds) => window.electronAPI.assessments.getByPatients(patientIds),
    create: (inserts) => window.electronAPI.assessments.create(inserts),
    get: (id) => window.electronAPI.assessments.get(id),
    update: (id, data) => window.electronAPI.assessments.update(id, data),
    delete: (id) => window.electronAPI.assessments.delete(id),
  },
  backup: {
    save: () => window.electronAPI.backup.save(),
  },
}
