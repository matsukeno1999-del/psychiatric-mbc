import { describe, expect, test } from 'vitest'
import { normalizeDate, parseCsv, parseImportCsv, planImport } from './import'
import { SCALE_DEFINITIONS } from './scales'
import type { Assessment, Patient } from './types'

// --- テスト用CSV生成ヘルパー ---

const GAD7_ITEMS = SCALE_DEFINITIONS['GAD-7'].items

function scaleCsvHeader(): string {
  const items = GAD7_ITEMS.map((i) => `GAD-7 ${i.label}`)
  return ['No', '患者ID', '性別', '年齢', '病名', '評価日', 'GAD-7 合計点', ...items].join(',')
}

function scaleCsvRow(no: number, code: string, date: string, scores: number[]): string {
  const total = scores.reduce((a, b) => a + b, 0)
  return [no, code, '男性', 45, '不安症', date, total, ...scores].join(',')
}

function makePatient(id: string, code: string): Patient {
  return { id, anonymous_code: code, diagnosis: null, notes: null, age: null, gender: null, created_at: '2026-01-01T00:00:00Z' }
}

function makeAssessment(patientId: string, scale: string, date: string): Assessment {
  return { id: `a-${patientId}-${scale}-${date}`, patient_id: patientId, scale_name: scale, scores: {}, total_score: 0, assessed_at: date, notes: null, created_at: date }
}

// --- parseCsv ---

describe('parseCsv', () => {
  test('カンマ区切りの基本的な行をパースする', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']])
  })

  test('引用符付きセル（カンマ・改行・二重引用符）を正しく扱う', () => {
    const csv = '"a,b","line1\nline2","say ""hi"""'
    expect(parseCsv(csv)).toEqual([['a,b', 'line1\nline2', 'say "hi"']])
  })

  test('BOMとCRLFを処理する', () => {
    expect(parseCsv('\uFEFF' + 'a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']])
  })
})

// --- normalizeDate ---

describe('normalizeDate', () => {
  test('YYYY-MM-DD をそのまま受け付ける', () => {
    expect(normalizeDate('2026-07-01')).toBe('2026-07-01')
  })

  test('Excel由来の YYYY/M/D をゼロ埋めして正規化する', () => {
    expect(normalizeDate('2026/7/1')).toBe('2026-07-01')
  })

  test('存在しない日付は null を返す', () => {
    expect(normalizeDate('2026-02-30')).toBeNull()
    expect(normalizeDate('20260701')).toBeNull()
    expect(normalizeDate('')).toBeNull()
  })
})

// --- parseImportCsv ---

describe('parseImportCsv', () => {
  test('尺度別CSVを患者情報つきでパースする', () => {
    const csv = [scaleCsvHeader(), scaleCsvRow(1, 'PT-001', '2026-07-01', [1, 2, 3, 0, 1, 2, 3])].join('\n')
    const result = parseImportCsv(csv)

    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(1)
    const row = result.rows[0]
    expect(row.anonymous_code).toBe('PT-001')
    expect(row.gender).toBe('男性')
    expect(row.age).toBe(45)
    expect(row.diagnosis).toBe('不安症')
    expect(row.assessed_at).toBe('2026-07-01')
    expect(row.assessments).toHaveLength(1)
    expect(row.assessments[0].scale_name).toBe('GAD-7')
    expect(row.assessments[0].total_score).toBe(12)
    expect(row.assessments[0].scores[GAD7_ITEMS[0].id]).toBe(1)
  })

  test('患者ID別（wide）CSVでNAの尺度はスキップする', () => {
    const phq = SCALE_DEFINITIONS['PHQ-9'].items
    const header = ['No', '患者ID', '性別', '年齢', '病名', '評価日',
      ...phq.map((i) => `PHQ-9 ${i.label}`), 'PHQ-9 合計点',
      ...GAD7_ITEMS.map((i) => `GAD-7 ${i.label}`), 'GAD-7 合計点'].join(',')
    const row = ['1', 'PT-002', '女性', '30', 'うつ病', '2026-06-15',
      ...phq.map(() => '2'), String(phq.length * 2),
      ...GAD7_ITEMS.map(() => 'NA'), 'NA'].join(',')
    const result = parseImportCsv([header, row].join('\n'))

    expect(result.errors).toEqual([])
    expect(result.rows[0].assessments).toHaveLength(1)
    expect(result.rows[0].assessments[0].scale_name).toBe('PHQ-9')
    expect(result.rows[0].assessments[0].total_score).toBe(phq.length * 2)
  })

  test('範囲外スコアの尺度はエラーにしてスキップする', () => {
    const csv = [scaleCsvHeader(), scaleCsvRow(1, 'PT-001', '2026-07-01', [9, 0, 0, 0, 0, 0, 0])].join('\n')
    const result = parseImportCsv(csv)

    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.rows[0].assessments).toHaveLength(0)
  })

  test('評価日が不正な行はスキップしてエラーを報告する', () => {
    const csv = [
      scaleCsvHeader(),
      scaleCsvRow(1, 'PT-001', 'invalid', [1, 1, 1, 1, 1, 1, 1]),
      scaleCsvRow(2, 'PT-002', '2026-07-02', [1, 1, 1, 1, 1, 1, 1]),
    ].join('\n')
    const result = parseImportCsv(csv)

    expect(result.errors).toHaveLength(1)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].anonymous_code).toBe('PT-002')
  })

  test('ファイル内の重複（患者×尺度×評価日）は警告してスキップする', () => {
    const csv = [
      scaleCsvHeader(),
      scaleCsvRow(1, 'PT-001', '2026-07-01', [1, 1, 1, 1, 1, 1, 1]),
      scaleCsvRow(2, 'PT-001', '2026-07-01', [2, 2, 2, 2, 2, 2, 2]),
    ].join('\n')
    const result = parseImportCsv(csv)

    expect(result.warnings.length).toBeGreaterThan(0)
    const total = result.rows.reduce((n, r) => n + r.assessments.length, 0)
    expect(total).toBe(1)
  })

  test('CSV合計点が項目合計と食い違う場合は警告し項目合計を採用する', () => {
    const items = [1, 1, 1, 1, 1, 1, 1]
    const badRow = [1, 'PT-001', '男性', 45, '不安症', '2026-07-01', 99, ...items].join(',')
    const result = parseImportCsv([scaleCsvHeader(), badRow].join('\n'))

    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.rows[0].assessments[0].total_score).toBe(7)
  })

  test('必須ヘッダーがなければエラーを返す', () => {
    const result = parseImportCsv('foo,bar\n1,2')
    expect(result.rows).toEqual([])
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

// --- planImport ---

describe('planImport', () => {
  test('未登録の患者は新規、登録済みの評価は重複としてカウントする', () => {
    const csv = [
      scaleCsvHeader(),
      scaleCsvRow(1, 'PT-001', '2026-07-01', [1, 1, 1, 1, 1, 1, 1]),
      scaleCsvRow(2, 'PT-001', '2026-07-02', [2, 2, 2, 2, 2, 2, 2]),
      scaleCsvRow(3, 'PT-NEW', '2026-07-01', [0, 0, 0, 0, 0, 0, 1]),
    ].join('\n')
    const { rows } = parseImportCsv(csv)

    const existing = [makePatient('id-1', 'PT-001')]
    const existingAssessments = [makeAssessment('id-1', 'GAD-7', '2026-07-01')]
    const plan = planImport(rows, existing, existingAssessments)

    expect(plan.newPatients).toHaveLength(1)
    expect(plan.newPatients[0].anonymous_code).toBe('PT-NEW')
    expect(plan.existingPatientCodes).toEqual(['PT-001'])
    expect(plan.duplicateCount).toBe(1)
    expect(plan.assessments).toHaveLength(2)
    expect(plan.assessments.map((a) => `${a.anonymous_code}/${a.assessed_at}`).sort()).toEqual([
      'PT-001/2026-07-02',
      'PT-NEW/2026-07-01',
    ])
  })

  test('同じ新規患者が複数行に出ても患者は1回だけ作成される', () => {
    const csv = [
      scaleCsvHeader(),
      scaleCsvRow(1, 'PT-NEW', '2026-07-01', [1, 1, 1, 1, 1, 1, 1]),
      scaleCsvRow(2, 'PT-NEW', '2026-07-08', [0, 0, 0, 0, 0, 0, 0]),
    ].join('\n')
    const { rows } = parseImportCsv(csv)
    const plan = planImport(rows, [], [])

    expect(plan.newPatients).toHaveLength(1)
    expect(plan.assessments).toHaveLength(2)
    expect(plan.duplicateCount).toBe(0)
  })
})
