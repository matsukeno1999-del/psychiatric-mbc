import { SCALE_DEFINITIONS, SCALE_NAMES } from './scales'
import type { Assessment, Patient, ScaleName } from './types'

export interface ParsedAssessment {
  scale_name: ScaleName
  scores: Record<string, number>
  total_score: number
}

export interface ParsedRow {
  line: number
  anonymous_code: string
  gender: string | null
  age: number | null
  diagnosis: string | null
  assessed_at: string
  assessments: ParsedAssessment[]
}

export interface ImportParseResult {
  rows: ParsedRow[]
  errors: string[]
  warnings: string[]
}

export interface PlannedPatient {
  anonymous_code: string
  gender: string | null
  age: number | null
  diagnosis: string | null
  notes: null
}

export interface PlannedAssessment {
  anonymous_code: string
  scale_name: ScaleName
  scores: Record<string, number>
  total_score: number
  assessed_at: string
}

export interface ImportPlan {
  newPatients: PlannedPatient[]
  existingPatientCodes: string[]
  assessments: PlannedAssessment[]
  duplicateCount: number
}

interface ScaleColumns {
  items: { itemId: string; col: number }[]
  totalCol: number | null
}

interface ColumnMap {
  codeCol: number
  genderCol: number
  ageCol: number
  diagnosisCol: number
  dateCol: number
  scaleColumns: Map<ScaleName, ScaleColumns>
}

const MAX_MESSAGES = 50

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

export function normalizeDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${m[1]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildHeaderLookup(): Map<string, { scale: ScaleName; itemId: string | 'total' }> {
  const lookup = new Map<string, { scale: ScaleName; itemId: string | 'total' }>()
  for (const scaleName of SCALE_NAMES) {
    const def = SCALE_DEFINITIONS[scaleName]
    for (const item of def.items) {
      lookup.set(`${scaleName} ${item.label}`, { scale: scaleName, itemId: item.id })
    }
    lookup.set(`${scaleName} 合計点`, { scale: scaleName, itemId: 'total' })
  }
  return lookup
}

const FIXED_COLUMNS = new Set(['No', '患者ID', '性別', '年齢', '病名', '評価日'])

export function buildColumnMap(header: string[]): { map: ColumnMap | null; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const lookup = buildHeaderLookup()
  const scaleColumns = new Map<ScaleName, ScaleColumns>()
  let codeCol = -1
  let genderCol = -1
  let ageCol = -1
  let diagnosisCol = -1
  let dateCol = -1

  header.forEach((cell, col) => {
    const name = cell.trim()
    if (name === '患者ID') codeCol = col
    else if (name === '性別') genderCol = col
    else if (name === '年齢') ageCol = col
    else if (name === '病名') diagnosisCol = col
    else if (name === '評価日') dateCol = col
    else if (FIXED_COLUMNS.has(name) || name === '') {
      // No 列や空列は無視
    } else {
      const hit = lookup.get(name)
      if (!hit) {
        if (warnings.length < MAX_MESSAGES) warnings.push(`未知の列を無視しました: ${name}`)
        return
      }
      const entry = scaleColumns.get(hit.scale) ?? { items: [], totalCol: null }
      if (hit.itemId === 'total') entry.totalCol = col
      else entry.items.push({ itemId: hit.itemId, col })
      scaleColumns.set(hit.scale, entry)
    }
  })

  if (codeCol === -1) errors.push('ヘッダーに「患者ID」列がありません')
  if (dateCol === -1) errors.push('ヘッダーに「評価日」列がありません')
  if (scaleColumns.size === 0) errors.push('評価尺度の列（例: PHQ-9 の項目列）が見つかりません')
  if (errors.length > 0) return { map: null, errors, warnings }

  for (const [scaleName, cols] of scaleColumns) {
    const expected = SCALE_DEFINITIONS[scaleName].items.length
    if (cols.items.length < expected) {
      warnings.push(`${scaleName}: 項目列が ${cols.items.length}/${expected} しかありません（不足分は最小値で補完します）`)
    }
  }

  return {
    map: { codeCol, genderCol, ageCol, diagnosisCol, dateCol, scaleColumns },
    errors,
    warnings,
  }
}

function isNa(value: string | undefined): boolean {
  const t = (value ?? '').trim()
  return t === '' || t.toUpperCase() === 'NA'
}

function parseScale(
  scaleName: ScaleName,
  cols: ScaleColumns,
  row: string[],
  line: number,
  errors: string[],
  warnings: string[]
): ParsedAssessment | null {
  const totalRaw = cols.totalCol != null ? row[cols.totalCol] : undefined
  const allItemsNa = cols.items.every(({ col }) => isNa(row[col]))
  if (allItemsNa && (cols.totalCol == null || isNa(totalRaw))) return null

  const def = SCALE_DEFINITIONS[scaleName]
  const itemDefs = new Map(def.items.map((item) => [item.id, item]))
  const scores: Record<string, number> = {}
  const presentIds = new Set<string>()

  for (const { itemId, col } of cols.items) {
    const itemDef = itemDefs.get(itemId)
    if (!itemDef) continue
    presentIds.add(itemId)
    const raw = row[col]
    if (isNa(raw)) {
      scores[itemId] = itemDef.minScore ?? 0
      continue
    }
    const value = Number(raw.trim())
    if (!Number.isInteger(value)) {
      if (errors.length < MAX_MESSAGES) errors.push(`${line}行目: ${scaleName}「${itemDef.label}」が数値ではありません（${raw.trim()}）`)
      return null
    }
    const min = itemDef.minScore ?? 0
    if (value < min || value > itemDef.maxScore) {
      if (errors.length < MAX_MESSAGES) errors.push(`${line}行目: ${scaleName}「${itemDef.label}」が範囲外です（${value}: ${min}〜${itemDef.maxScore}）`)
      return null
    }
    scores[itemId] = value
  }

  for (const item of def.items) {
    if (!presentIds.has(item.id)) scores[item.id] = item.minScore ?? 0
  }

  const total = def.items.reduce((sum, item) => sum + (scores[item.id] ?? 0), 0)
  if (cols.totalCol != null && !isNa(totalRaw)) {
    const csvTotal = Number((totalRaw ?? '').trim())
    if (Number.isFinite(csvTotal) && csvTotal !== total && warnings.length < MAX_MESSAGES) {
      warnings.push(`${line}行目: ${scaleName} 合計点（${csvTotal}）が項目合計（${total}）と一致しません。項目合計を採用します`)
    }
  }

  return { scale_name: scaleName, scores, total_score: total }
}

export function parseImportCsv(text: string): ImportParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  const allRows = parseCsv(text)
  const nonBlank = allRows
    .map((cells, index) => ({ cells, line: index + 1 }))
    .filter(({ cells }) => cells.some((c) => c.trim() !== ''))

  if (nonBlank.length < 2) {
    return { rows: [], errors: ['CSVにデータ行がありません'], warnings }
  }

  const { map, errors: headerErrors, warnings: headerWarnings } = buildColumnMap(nonBlank[0].cells)
  errors.push(...headerErrors)
  warnings.push(...headerWarnings)
  if (!map) return { rows: [], errors, warnings }

  const rows: ParsedRow[] = []
  const seen = new Set<string>()

  for (const { cells, line } of nonBlank.slice(1)) {
    const code = (cells[map.codeCol] ?? '').trim()
    if (code === '') {
      if (errors.length < MAX_MESSAGES) errors.push(`${line}行目: 患者IDが空のためスキップしました`)
      continue
    }
    const date = normalizeDate(cells[map.dateCol] ?? '')
    if (!date) {
      if (errors.length < MAX_MESSAGES) errors.push(`${line}行目: 評価日「${(cells[map.dateCol] ?? '').trim()}」が不正のためスキップしました`)
      continue
    }

    const assessments: ParsedAssessment[] = []
    for (const [scaleName, cols] of map.scaleColumns) {
      const parsed = parseScale(scaleName, cols, cells, line, errors, warnings)
      if (!parsed) continue
      const key = `${code}\x00${scaleName}\x00${date}`
      if (seen.has(key)) {
        if (warnings.length < MAX_MESSAGES) warnings.push(`${line}行目: ${code} / ${scaleName} / ${date} はファイル内で重複しているためスキップしました`)
        continue
      }
      seen.add(key)
      assessments.push(parsed)
    }

    const ageRaw = map.ageCol !== -1 ? (cells[map.ageCol] ?? '').trim() : ''
    const age = ageRaw !== '' && Number.isInteger(Number(ageRaw)) ? Number(ageRaw) : null
    rows.push({
      line,
      anonymous_code: code,
      gender: map.genderCol !== -1 ? (cells[map.genderCol] ?? '').trim() || null : null,
      age,
      diagnosis: map.diagnosisCol !== -1 ? (cells[map.diagnosisCol] ?? '').trim() || null : null,
      assessed_at: date,
      assessments,
    })
  }

  return { rows, errors, warnings }
}

function dateOnly(value: string): string {
  return value.slice(0, 10)
}

export function planImport(rows: ParsedRow[], existingPatients: Patient[], existingAssessments: Assessment[]): ImportPlan {
  const existingByCode = new Map(existingPatients.map((p) => [p.anonymous_code, p]))
  const idToCode = new Map(existingPatients.map((p) => [p.id, p.anonymous_code]))
  const existingKeys = new Set(
    existingAssessments
      .map((a) => {
        const code = idToCode.get(a.patient_id)
        return code ? `${code}\x00${a.scale_name}\x00${dateOnly(a.assessed_at)}` : null
      })
      .filter((k): k is string => k !== null)
  )

  const newPatients: PlannedPatient[] = []
  const newPatientCodes = new Set<string>()
  const existingCodes = new Set<string>()
  const assessments: PlannedAssessment[] = []
  let duplicateCount = 0

  for (const row of rows) {
    if (existingByCode.has(row.anonymous_code)) {
      existingCodes.add(row.anonymous_code)
    } else if (!newPatientCodes.has(row.anonymous_code)) {
      newPatientCodes.add(row.anonymous_code)
      newPatients.push({
        anonymous_code: row.anonymous_code,
        gender: row.gender,
        age: row.age,
        diagnosis: row.diagnosis,
        notes: null,
      })
    }

    for (const a of row.assessments) {
      const key = `${row.anonymous_code}\x00${a.scale_name}\x00${row.assessed_at}`
      if (existingKeys.has(key)) {
        duplicateCount++
        continue
      }
      existingKeys.add(key)
      assessments.push({
        anonymous_code: row.anonymous_code,
        scale_name: a.scale_name,
        scores: a.scores,
        total_score: a.total_score,
        assessed_at: row.assessed_at,
      })
    }
  }

  return {
    newPatients,
    existingPatientCodes: Array.from(existingCodes),
    assessments,
    duplicateCount,
  }
}
