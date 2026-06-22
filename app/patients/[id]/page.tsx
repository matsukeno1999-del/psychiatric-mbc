'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, ClipboardPlusIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { SCALE_DEFINITIONS, SCALE_COLORS, getSeverity, SCALE_NAMES } from '@/lib/scales'
import type { Patient, Assessment, ScaleName } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type PeriodFilter = '1month' | '3months' | 'all'

interface ChartDataPoint {
  date: string
  [key: string]: string | number | null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function filterByPeriod(assessments: Assessment[], period: PeriodFilter): Assessment[] {
  if (period === 'all') return assessments
  const now = new Date()
  const months = period === '1month' ? 1 : 3
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
  return assessments.filter((a) => new Date(a.assessed_at) >= cutoff)
}

function buildChartData(assessments: Assessment[]): ChartDataPoint[] {
  const byDate: Record<string, ChartDataPoint> = {}

  for (const a of assessments) {
    const date = a.assessed_at
    if (!byDate[date]) {
      byDate[date] = { date }
    }
    byDate[date][a.scale_name] = a.total_score
  }

  return Object.values(byDate).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

function SeverityBadge({ scaleName, score }: { scaleName: ScaleName; score: number }) {
  const { label, color } = getSeverity(scaleName, score)
  return (
    <span
      className="inline-flex h-5 items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleDetail(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const [patientRes, assessRes] = await Promise.all([
        supabase.from('patients').select('*').eq('id', id).single(),
        supabase
          .from('assessments')
          .select('*')
          .eq('patient_id', id)
          .order('assessed_at', { ascending: false }),
      ])

      if (patientRes.error) {
        setError(`患者情報の取得に失敗しました: ${patientRes.error.message}`)
        setLoading(false)
        return
      }
      if (assessRes.error) {
        setError(`評価データの取得に失敗しました: ${assessRes.error.message}`)
        setLoading(false)
        return
      }

      setPatient(patientRes.data)
      setAssessments(assessRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        読み込み中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen p-8 text-sm text-muted-foreground">
        患者が見つかりませんでした
      </div>
    )
  }

  const filteredAssessments = filterByPeriod(assessments, period)
  const chartData = buildChartData(filteredAssessments)
  const usedScales = SCALE_NAMES.filter((name) =>
    filteredAssessments.some((a) => a.scale_name === name)
  )

  const periodLabels: Record<PeriodFilter, string> = {
    '1month': '1ヶ月',
    '3months': '3ヶ月',
    'all': '全期間',
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            一覧に戻る
          </Link>
          <Button
            className="gap-2"
            onClick={() => router.push(`/patients/${id}/assess`)}
          >
            <ClipboardPlusIcon />
            評価を入力
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <CardTitle className="text-xl">{patient.anonymous_code}</CardTitle>
              {patient.diagnosis && (
                <Badge variant="secondary">{patient.diagnosis}</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                登録日: {formatDate(patient.created_at)}
              </span>
            </div>
            {patient.notes && (
              <p className="mt-1 text-sm text-muted-foreground">{patient.notes}</p>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>経時グラフ</CardTitle>
              <div className="flex gap-2">
                {(['1month', '3months', 'all'] as PeriodFilter[]).map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod(p)}
                  >
                    {periodLabels[p]}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                評価データがありません
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(v) => formatDate(String(v))}
                    formatter={(value, name) => [
                      value,
                      String(name),
                    ]}
                  />
                  <Legend />
                  {usedScales.map((scaleName) => {
                    const def = SCALE_DEFINITIONS[scaleName]
                    return def.cutoffLines.map((cutoff) => (
                      <ReferenceLine
                        key={`${scaleName}-${cutoff}`}
                        y={cutoff}
                        stroke={SCALE_COLORS[scaleName]}
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                      />
                    ))
                  })}
                  {usedScales.map((scaleName) => (
                    <Line
                      key={scaleName}
                      type="monotone"
                      dataKey={scaleName}
                      stroke={SCALE_COLORS[scaleName]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>評価履歴</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {assessments.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                評価データがありません
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>尺度</TableHead>
                    <TableHead>スコア</TableHead>
                    <TableHead>重症度</TableHead>
                    <TableHead>メモ</TableHead>
                    <TableHead className="text-right">詳細</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => {
                    const scaleName = assessment.scale_name as ScaleName
                    const def = SCALE_DEFINITIONS[scaleName]
                    const isExpanded = expandedIds.has(assessment.id)
                    return (
                      <>
                        <TableRow key={assessment.id}>
                          <TableCell className="text-muted-foreground">
                            {formatDate(assessment.assessed_at)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {assessment.scale_name}
                          </TableCell>
                          <TableCell>
                            {assessment.total_score}
                            <span className="text-xs text-muted-foreground">
                              /{def?.maxScore ?? '?'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <SeverityBadge scaleName={scaleName} score={assessment.total_score} />
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {assessment.notes ?? '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleDetail(assessment.id)}
                              className="gap-1"
                            >
                              {isExpanded
                                ? <><ChevronUpIcon className="size-3.5" />閉じる</>
                                : <><ChevronDownIcon className="size-3.5" />詳細</>
                              }
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && def && (
                          <TableRow key={`${assessment.id}-detail`} className="bg-muted/40 hover:bg-muted/40">
                            <TableCell colSpan={6} className="py-3">
                              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                                {def.items.map((item) => {
                                  const score = assessment.scores[item.id] ?? (item.minScore ?? 0)
                                  return (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between rounded-md bg-background px-3 py-1.5 text-sm"
                                    >
                                      <span className="text-muted-foreground">{item.label}</span>
                                      <span className="ml-3 shrink-0 font-medium">
                                        {score}
                                        <span className="text-xs text-muted-foreground">/{item.maxScore}</span>
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
