'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, SaveIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SCALE_DEFINITIONS, getSeverity, SCALE_NAMES, SCALE_GROUPS } from '@/lib/scales'
import type { ScaleName, ScaleItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

interface ScoreState {
  [itemId: string]: number
}

interface FormState {
  assessedAt: string
  selectedScales: ScaleName[]
  scores: Record<ScaleName, ScoreState>
  notes: string
}

function ScaleForm({
  scaleName,
  scores,
  onChange,
}: {
  scaleName: ScaleName
  scores: ScoreState
  onChange: (itemId: string, value: number) => void
}) {
  const def = SCALE_DEFINITIONS[scaleName]
  const totalScore = def.items.reduce(
    (sum, item) => sum + (scores[item.id] ?? (item.minScore ?? 0)),
    0
  )
  const { label: severityLabel, color: severityColor } = getSeverity(scaleName, totalScore)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{def.name}</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{def.description}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{totalScore}</span>
              <span className="text-sm text-muted-foreground">/ {def.maxScore}</span>
              <span
                className="inline-flex h-5 items-center rounded-full px-2 text-xs font-medium text-white"
                style={{ backgroundColor: severityColor }}
              >
                {severityLabel}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {def.items.map((item: ScaleItem) => {
            const minScore = item.minScore ?? 0
            const current = scores[item.id] ?? minScore
            return (
              <div key={item.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">{item.label}</label>
                  <span className="min-w-8 text-right text-sm font-medium">
                    {current} / {item.maxScore}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={minScore}
                    max={item.maxScore}
                    step={1}
                    value={current}
                    onChange={(e) => onChange(item.id, Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
                  />
                  <div className="flex gap-1">
                    {Array.from(
                      { length: item.maxScore - minScore + 1 },
                      (_, i) => i + minScore
                    ).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onChange(item.id, v)}
                        className={`size-6 rounded text-xs font-medium transition-colors ${
                          current === v
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function buildInitialScores(): Record<ScaleName, ScoreState> {
  const result = {} as Record<ScaleName, ScoreState>
  for (const name of SCALE_NAMES) {
    const def = SCALE_DEFINITIONS[name]
    const initial: ScoreState = {}
    for (const item of def.items) {
      initial[item.id] = item.minScore ?? 0
    }
    result[name] = initial
  }
  return result
}

export default function AssessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    assessedAt: todayString(),
    selectedScales: [],
    scores: buildInitialScores(),
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function toggleScale(name: ScaleName) {
    setForm((prev) => ({
      ...prev,
      selectedScales: prev.selectedScales.includes(name)
        ? prev.selectedScales.filter((s) => s !== name)
        : [...prev.selectedScales, name],
    }))
  }

  function updateScore(scaleName: ScaleName, itemId: string, value: number) {
    setForm((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [scaleName]: {
          ...prev.scores[scaleName],
          [itemId]: value,
        },
      },
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.selectedScales.length === 0) {
      setError('尺度を1つ以上選択してください')
      return
    }
    setSubmitting(true)
    setError(null)

    const inserts = form.selectedScales.map((scaleName) => {
      const def = SCALE_DEFINITIONS[scaleName]
      const scaleScores = form.scores[scaleName]
      const totalScore = def.items.reduce(
        (sum, item) => sum + (scaleScores[item.id] ?? 0),
        0
      )
      return {
        patient_id: id,
        scale_name: scaleName,
        scores: scaleScores,
        total_score: totalScore,
        assessed_at: form.assessedAt,
        notes: form.notes.trim() || null,
      }
    })

    const { error: err } = await supabase.from('assessments').insert(inserts)
    if (err) {
      setError(`保存に失敗しました: ${err.message}`)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => {
      router.push(`/patients/${id}`)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href={`/patients/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            患者詳細に戻る
          </Link>
        </div>

        <h1 className="mb-6 text-xl font-bold">評価入力</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="assessed_at">
                  評価日
                </label>
                <input
                  id="assessed_at"
                  type="date"
                  value={form.assessedAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, assessedAt: e.target.value }))
                  }
                  className="h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium">使用する尺度</span>
                {SCALE_GROUPS.map((group) => (
                  <div key={group.diagnosis} className="flex flex-col gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: group.color }}
                    >
                      {group.diagnosis}
                    </span>
                    <div className="flex flex-wrap gap-3 pl-2">
                      {group.scales.map((name) => (
                        <label
                          key={name}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={form.selectedScales.includes(name)}
                            onChange={() => toggleScale(name)}
                            className="h-4 w-4 rounded border-input accent-primary"
                          />
                          {name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" htmlFor="notes">
                  メモ（共通）
                </label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={2}
                  placeholder="任意のメモ"
                  className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {form.selectedScales.map((scaleName) => (
            <ScaleForm
              key={scaleName}
              scaleName={scaleName}
              scores={form.scores[scaleName]}
              onChange={(itemId, value) => updateScore(scaleName, itemId, value)}
            />
          ))}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
              保存しました。患者詳細ページに戻ります...
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="gap-2">
              <SaveIcon />
              {submitting ? '保存中...' : '保存する'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
