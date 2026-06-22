'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, DownloadIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SCALE_DEFINITIONS, SCALE_GROUPS, SCALE_NAMES } from '@/lib/scales'
import type { Patient, Assessment, ScaleName } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function downloadCsv(content: string, filename: string) {
  const bom = '﻿'
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function csvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// パターン1: 患者×評価日を1行に統合（全尺度を列展開）
function generatePatientCsv(patients: Patient[], assessments: Assessment[]): string {
  const patientMap = new Map(patients.map((p) => [p.id, p]))

  // 患者×日付でグループ化
  const grouped = new Map<string, Assessment[]>()
  for (const a of assessments) {
    const key = `${a.patient_id}\x00${a.assessed_at}`
    const list = grouped.get(key) ?? []
    list.push(a)
    grouped.set(key, list)
  }

  // 全尺度ヘッダーを構築（尺度名 項目名 … 尺度名 合計点）
  const scaleHeaders: string[] = []
  for (const scaleName of SCALE_NAMES) {
    const def = SCALE_DEFINITIONS[scaleName]
    for (const item of def.items) {
      scaleHeaders.push(`${scaleName} ${item.label}`)
    }
    scaleHeaders.push(`${scaleName} 合計点`)
  }

  const rows: string[] = []
  rows.push(['No', '患者ID', '性別', '年齢', '病名', '評価日', ...scaleHeaders.map(csvCell)].join(','))

  // 患者ID順 → 日付昇順
  const entries = Array.from(grouped.entries())
    .map(([key, list]) => {
      const sep = key.indexOf('\x00')
      return { patientId: key.slice(0, sep), date: key.slice(sep + 1), list }
    })
    .sort((a, b) => {
      const pa = patientMap.get(a.patientId)?.anonymous_code ?? ''
      const pb = patientMap.get(b.patientId)?.anonymous_code ?? ''
      if (pa !== pb) return pa.localeCompare(pb)
      return a.date.localeCompare(b.date)
    })

  entries.forEach(({ patientId, date, list }, i) => {
    const patient = patientMap.get(patientId)
    if (!patient) return

    const byScale = new Map(list.map((a) => [a.scale_name, a]))

    const cells: string[] = []
    for (const scaleName of SCALE_NAMES) {
      const def = SCALE_DEFINITIONS[scaleName]
      const a = byScale.get(scaleName)
      for (const item of def.items) {
        cells.push(a ? csvCell(a.scores[item.id] ?? (item.minScore ?? 0)) : '')
      }
      cells.push(a ? csvCell(a.total_score) : '')
    }

    rows.push(
      [
        csvCell(i + 1),
        csvCell(patient.anonymous_code),
        csvCell(patient.gender),
        csvCell(patient.age),
        csvCell(patient.diagnosis),
        csvCell(date),
        ...cells,
      ].join(',')
    )
  })

  return rows.join('\n')
}

// パターン2: 評価尺度ごとの全患者（wide format）
function generateScaleCsv(scaleName: ScaleName, patients: Patient[], assessments: Assessment[]): string {
  const def = SCALE_DEFINITIONS[scaleName]
  const patientMap = new Map(patients.map((p) => [p.id, p]))

  const itemHeaders = def.items.map((item) => csvCell(`${scaleName} ${item.label}`))
  const rows: string[] = []
  rows.push(
    ['No', '患者ID', '性別', '年齢', '病名', '評価日', csvCell(`${scaleName} 合計点`), ...itemHeaders].join(',')
  )

  assessments.forEach((a, i) => {
    const patient = patientMap.get(a.patient_id)
    if (!patient) return
    const itemScores = def.items.map((item) => a.scores[item.id] ?? (item.minScore ?? 0))
    rows.push(
      [
        csvCell(i + 1),
        csvCell(patient.anonymous_code),
        csvCell(patient.gender),
        csvCell(patient.age),
        csvCell(patient.diagnosis),
        csvCell(a.assessed_at),
        csvCell(a.total_score),
        ...itemScores.map(csvCell),
      ].join(',')
    )
  })

  return rows.join('\n')
}

type Tab = 'patient' | 'scale'

export default function ExportPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('patient')

  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set())
  const [exporting1, setExporting1] = useState(false)

  const [selectedScale, setSelectedScale] = useState<ScaleName>('PHQ-9')
  const [exporting2, setExporting2] = useState(false)

  useEffect(() => {
    supabase
      .from('patients')
      .select('*')
      .order('anonymous_code', { ascending: true })
      .then(({ data }) => {
        setPatients(data ?? [])
        setLoading(false)
      })
  }, [])

  function togglePatient(id: string) {
    setSelectedPatients((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAllPatients() {
    if (selectedPatients.size === patients.length) {
      setSelectedPatients(new Set())
    } else {
      setSelectedPatients(new Set(patients.map((p) => p.id)))
    }
  }

  async function handleExportByPatient() {
    if (selectedPatients.size === 0) return
    setExporting1(true)

    const ids = Array.from(selectedPatients)
    const selectedPats = patients.filter((p) => ids.includes(p.id))

    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .in('patient_id', ids)
      .order('assessed_at', { ascending: true })

    const csv = generatePatientCsv(selectedPats, assessments ?? [])
    const label = ids.length === 1
      ? selectedPats[0].anonymous_code
      : `${ids.length}patients`
    downloadCsv(csv, `mbc_patient_${label}_${today()}.csv`)
    setExporting1(false)
  }

  async function handleExportByScale() {
    setExporting2(true)

    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .eq('scale_name', selectedScale)
      .order('assessed_at', { ascending: true })

    const csv = generateScaleCsv(selectedScale, patients, assessments ?? [])
    downloadCsv(csv, `mbc_scale_${selectedScale}_${today()}.csv`)
    setExporting2(false)
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            一覧に戻る
          </Link>
        </div>

        <div>
          <h1 className="text-xl font-bold">データ出力（CSV）</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            収集した評価データを研究用にエクスポートします
          </p>
        </div>

        {/* タブ */}
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
          <button
            onClick={() => setTab('patient')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'patient'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            患者ID別
          </button>
          <button
            onClick={() => setTab('scale')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'scale'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            評価尺度別
          </button>
        </div>

        {/* パターン1: 患者ID別 */}
        {tab === 'patient' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">患者を選択してすべての評価尺度を出力</CardTitle>
              <p className="text-sm text-muted-foreground">
                出力形式: 1行 = 患者×評価日（wide形式）— 当日実施した全尺度の項目スコアを列展開。未実施尺度は空欄。
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              ) : patients.length === 0 ? (
                <p className="text-sm text-muted-foreground">患者が登録されていません</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {selectedPatients.size} / {patients.length} 件選択中
                    </span>
                    <button
                      onClick={toggleAllPatients}
                      className="text-xs text-primary hover:underline"
                    >
                      {selectedPatients.size === patients.length ? 'すべて解除' : 'すべて選択'}
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                    {patients.map((patient) => (
                      <label
                        key={patient.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPatients.has(patient.id)}
                          onChange={() => togglePatient(patient.id)}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <span className="flex-1 text-sm font-medium">{patient.anonymous_code}</span>
                        <span className="text-xs text-muted-foreground">
                          {[patient.gender, patient.age != null ? `${patient.age}歳` : null, patient.diagnosis]
                            .filter(Boolean)
                            .join(' / ')}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleExportByPatient}
                      disabled={selectedPatients.size === 0 || exporting1}
                      className="gap-2"
                    >
                      <DownloadIcon className="size-4" />
                      {exporting1 ? '出力中...' : 'CSVをダウンロード'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* パターン2: 尺度別 */}
        {tab === 'scale' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">評価尺度を選択してすべての患者を出力</CardTitle>
              <p className="text-sm text-muted-foreground">
                出力形式: 1行 = 1回の評価（wide形式）— 患者情報・日付・各項目得点を列で展開します
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {SCALE_GROUPS.map((group) => (
                  <div key={group.diagnosis}>
                    <p className="mb-1.5 text-xs font-semibold" style={{ color: group.color }}>
                      {group.diagnosis}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pl-2 sm:grid-cols-3">
                      {group.scales.map((name) => (
                        <label
                          key={name}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            selectedScale === name
                              ? 'border-primary bg-primary/5 font-medium text-primary'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="scale"
                            value={name}
                            checked={selectedScale === name}
                            onChange={() => setSelectedScale(name)}
                            className="accent-primary"
                          />
                          <span>{name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {SCALE_DEFINITIONS[name].items.length}項目
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedScale && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">{selectedScale} — {SCALE_DEFINITIONS[selectedScale].description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    列: No, 患者ID, 性別, 年齢, 病名, 評価日, {selectedScale} 合計点,{' '}
                    {SCALE_DEFINITIONS[selectedScale].items.map((i) => `${selectedScale} ${i.label}`).join(', ')}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleExportByScale}
                  disabled={exporting2 || loading}
                  className="gap-2"
                >
                  <DownloadIcon className="size-4" />
                  {exporting2 ? '出力中...' : 'CSVをダウンロード'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 凡例 */}
        <Card>
          <CardContent className="pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">出力フォーマットについて</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>・<span className="font-medium text-foreground">患者ID別（wide形式）</span>：1行 = 患者×評価日。同日に複数尺度を実施した場合も1行に統合。未実施尺度は空欄。列名は「尺度名 項目名」形式。</p>
              <p>・<span className="font-medium text-foreground">尺度別（wide形式）</span>：1行 = 1回の評価。列が統一されるため SPSS・Excel での分析に適しています。因子分析・信頼性分析に使いやすい形式です。</p>
              <p>・文字コードは UTF-8 (BOM付き) — Excel で直接開けます。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}
