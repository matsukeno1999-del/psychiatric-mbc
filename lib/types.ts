export interface Patient {
  id: string
  anonymous_code: string
  diagnosis: string | null
  notes: string | null
  age: number | null
  gender: string | null
  created_at: string
}

export interface Assessment {
  id: string
  patient_id: string
  scale_name: string
  scores: Record<string, number>
  total_score: number
  assessed_at: string
  notes: string | null
  created_at: string
}

export type ScaleName = 'PHQ-9' | 'MADRS' | 'HAM-D' | 'BDI-II' | 'YMRS' | 'PANSS' | 'BPRS' | 'DIEPSS' | 'CGI' | 'ISI' | 'GAD-7'

export interface ScaleItem {
  id: string
  label: string
  maxScore: number
  minScore?: number
}

export interface ScaleGroup {
  diagnosis: string
  scales: ScaleName[]
  color: string
}

export interface SeverityLevel {
  label: string
  min: number
  max: number
  color: string
}

export interface ScaleDefinition {
  name: ScaleName
  description: string
  items: ScaleItem[]
  maxScore: number
  severityLevels: SeverityLevel[]
  cutoffLines: number[]
}
