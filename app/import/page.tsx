'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, FileUpIcon, CheckCircle2Icon, AlertTriangleIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { parseImportCsv, planImport } from '@/lib/import'
import type { ImportParseResult, ImportPlan } from '@/lib/import'
import type { Patient } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ImportResult {
  createdPatients: number
  createdAssessments: number
  errors: string[]
}

const PREVIEW_LIMIT = 100

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null)
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [existingPatients, setExistingPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setLoading(true)
    setLoadError(null)
    setResult(null)
    setPlan(null)
    setFileName(file.name)

    try {
      const text = await file.text()
      const parsed = parseImportCsv(text)
      setParseResult(parsed)
      if (parsed.rows.length === 0) {
        setLoading(false)
        return
      }

      const { data: patients, error: patientsError } = await api.patients.getAll()
      if (patientsError) {
        setLoadError(`既存データの取得に失敗しました: ${patientsError.message}`)
        setLoading(false)
        return
      }
      const patientList = patients ?? []
      const { data: assessments, error: assessmentsError } = await api.assessments.getByPatients(patientList.map((p) => p.id))
      if (assessmentsError) {
        setLoadError(`既存データの取得に失敗しました: ${assessmentsError.message}`)
        setLoading(false)
        return
      }

      setExistingPatients(patientList)
      setPlan(planImport(parsed.rows, patientList, assessments ?? []))
    } catch (error: unknown) {
      setLoadError(`ファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    }
    setLoading(false)
  }

  async function handleImport() {
    if (!plan) return
    setImporting(true)
    const errors: string[] = []
    const codeToId = new Map(existingPatients.map((p) => [p.anonymous_code, p.id]))
    let createdPatients = 0

    for (const np of plan.newPatients) {
      const { data, error } = await api.patients.create(np)
      if (error || !data) {
        errors.push(`患者 ${np.anonymous_code} の登録に失敗しました: ${error?.message ?? '不明なエラー'}`)
        continue
      }
      codeToId.set(np.anonymous_code, data.id)
      createdPatients++
    }

    const inserts = plan.assessments
      .filter((a) => codeToId.has(a.anonymous_code))
      .map((a) => ({
        patient_id: codeToId.get(a.anonymous_code)!,
        scale_name: a.scale_name,
        scores: a.scores,
        total_score: a.total_score,
        assessed_at: a.assessed_at,
        notes: null,
      }))
    const skipped = plan.assessments.length - inserts.length
    if (skipped > 0) errors.push(`患者登録に失敗した ${skipped} 件の評価をスキップしました`)

    let createdAssessments = 0
    if (inserts.length > 0) {
      const { error } = await api.assessments.create(inserts)
      if (error) errors.push(`評価データの登録に失敗しました: ${error.message}`)
      else createdAssessments = inserts.length
    }

    setResult({ createdPatients, createdAssessments, errors })
    setImporting(false)
  }

  const hasFatalErrors = parseResult !== null && parseResult.rows.length === 0
  const canImport = plan !== null && result === null && !importing &&
    (plan.newPatients.length > 0 || plan.assessments.length > 0)

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="size-4" />一覧に戻る
          </Link>
        </div>

        <div>
          <h1 className="text-xl font-bold">データ取り込み（CSV）</h1>
          <p className="mt-1 text-sm text-muted-foreground">別のPCで出力したCSVファイルを読み込み、患者と評価データを追加します</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">CSVファイルを選択</CardTitle>
            <p className="text-sm text-muted-foreground">
              本システムの「データ出力」で作成したCSV（患者ID別・評価尺度別のどちらでも）に対応しています
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileSelected} />
            <div className="flex items-center gap-3">
              <Button onClick={() => fileInputRef.current?.click()} disabled={loading || importing} className="gap-2">
                <FileUpIcon className="size-4" />{loading ? '読み込み中...' : 'ファイルを選択'}
              </Button>
              {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
            </div>
            {loadError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{loadError}</div>
            )}
          </CardContent>
        </Card>

        {parseResult && parseResult.errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <AlertTriangleIcon className="size-4" />エラー（該当行はスキップされます）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-destructive">
                {parseResult.errors.map((msg, i) => <li key={i}>・{msg}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}

        {parseResult && parseResult.warnings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-amber-600">
                <AlertTriangleIcon className="size-4" />警告
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-muted-foreground">
                {parseResult.warnings.map((msg, i) => <li key={i}>・{msg}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}

        {hasFatalErrors && !loadError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            取り込めるデータがありませんでした。CSVの形式を確認してください。
          </div>
        )}

        {plan && result === null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">取り込み内容の確認</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryTile label="新規患者" value={plan.newPatients.length} />
                <SummaryTile label="既存患者" value={plan.existingPatientCodes.length} />
                <SummaryTile label="追加される評価" value={plan.assessments.length} />
                <SummaryTile label="重複スキップ" value={plan.duplicateCount} muted />
              </div>

              {plan.duplicateCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  ※ 同じ患者ID・評価尺度・評価日の組み合わせがすでに登録されている評価は取り込まれません
                </p>
              )}

              {plan.assessments.length > 0 && (
                <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2 font-medium">患者ID</th>
                        <th className="px-3 py-2 font-medium">評価日</th>
                        <th className="px-3 py-2 font-medium">評価尺度</th>
                        <th className="px-3 py-2 text-right font-medium">合計点</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.assessments.slice(0, PREVIEW_LIMIT).map((a, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-1.5 font-medium">{a.anonymous_code}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{a.assessed_at}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{a.scale_name}</td>
                          <td className="px-3 py-1.5 text-right">{a.total_score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {plan.assessments.length > PREVIEW_LIMIT && (
                    <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                      ほか {plan.assessments.length - PREVIEW_LIMIT} 件
                    </p>
                  )}
                </div>
              )}

              {plan.newPatients.length === 0 && plan.assessments.length === 0 ? (
                <p className="text-sm text-muted-foreground">追加するデータはありません（すべて登録済みです）</p>
              ) : (
                <div className="flex justify-end">
                  <Button onClick={handleImport} disabled={!canImport} className="gap-2">
                    <FileUpIcon className="size-4" />{importing ? '取り込み中...' : '取り込みを実行'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2Icon className="size-4 text-green-600" />取り込み結果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                患者 <span className="font-bold">{result.createdPatients}</span> 名、
                評価 <span className="font-bold">{result.createdAssessments}</span> 件を登録しました
              </p>
              {result.errors.length > 0 && (
                <ul className="space-y-1 text-sm text-destructive">
                  {result.errors.map((msg, i) => <li key={i}>・{msg}</li>)}
                </ul>
              )}
              <div className="flex justify-end">
                <Link href="/"><Button variant="outline">患者一覧へ戻る</Button></Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function SummaryTile({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${muted ? 'text-muted-foreground' : ''}`}>{value}</p>
    </div>
  )
}
