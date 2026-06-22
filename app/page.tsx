'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlusIcon, UserIcon, PencilIcon, Trash2Icon, DownloadIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Patient } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

interface PatientForm {
  anonymous_code: string
  diagnosis: string
  notes: string
  age: string
  gender: string
}

export default function HomePage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<PatientForm>({ anonymous_code: '', diagnosis: '', notes: '', age: '', gender: '' })
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [editTarget, setEditTarget] = useState<Patient | null>(null)
  const [editForm, setEditForm] = useState<PatientForm>({ anonymous_code: '', diagnosis: '', notes: '', age: '', gender: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadPatients() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (err) {
      setError(`患者データの取得に失敗しました: ${err.message}`)
    } else {
      setPatients(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPatients()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.anonymous_code.trim()) {
      setCreateError('匿名コードは必須です')
      return
    }
    setCreating(true)
    setCreateError(null)

    const { error: err } = await supabase.from('patients').insert({
      anonymous_code: createForm.anonymous_code.trim(),
      diagnosis: createForm.diagnosis.trim() || null,
      notes: createForm.notes.trim() || null,
      age: createForm.age ? parseInt(createForm.age, 10) : null,
      gender: createForm.gender || null,
    })

    if (err) {
      setCreateError(`登録に失敗しました: ${err.message}`)
      setCreating(false)
      return
    }

    setCreateForm({ anonymous_code: '', diagnosis: '', notes: '', age: '', gender: '' })
    setCreateOpen(false)
    setCreating(false)
    await loadPatients()
  }

  function openEdit(patient: Patient, e: React.MouseEvent) {
    e.stopPropagation()
    setEditTarget(patient)
    setEditForm({
      anonymous_code: patient.anonymous_code,
      diagnosis: patient.diagnosis ?? '',
      notes: patient.notes ?? '',
      age: patient.age != null ? String(patient.age) : '',
      gender: patient.gender ?? '',
    })
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    if (!editForm.anonymous_code.trim()) {
      setEditError('匿名コードは必須です')
      return
    }
    setEditing(true)
    setEditError(null)

    const { error: err } = await supabase
      .from('patients')
      .update({
        anonymous_code: editForm.anonymous_code.trim(),
        diagnosis: editForm.diagnosis.trim() || null,
        notes: editForm.notes.trim() || null,
        age: editForm.age ? parseInt(editForm.age, 10) : null,
        gender: editForm.gender || null,
      })
      .eq('id', editTarget.id)

    if (err) {
      setEditError(`更新に失敗しました: ${err.message}`)
      setEditing(false)
      return
    }

    setEditTarget(null)
    setEditing(false)
    await loadPatients()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    const { error: err } = await supabase
      .from('patients')
      .delete()
      .eq('id', deleteTarget.id)

    if (err) {
      setError(`削除に失敗しました: ${err.message}`)
    }

    setDeleteTarget(null)
    setDeleting(false)
    await loadPatients()
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              精神科 MBC 管理システム
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Measurement-Based Care — 評価尺度による治療効果の可視化
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/export">
              <Button variant="outline" className="gap-2">
                <DownloadIcon className="size-4" />
                データ出力
              </Button>
            </Link>

          {/* 新規登録ダイアログ */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <PlusIcon />
                  新規患者登録
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規患者登録</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4 pt-2">
                <PatientFormFields
                  form={createForm}
                  onChange={(f) => setCreateForm(f)}
                />
                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={creating}>
                    {creating ? '登録中...' : '登録する'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* 編集ダイアログ */}
        <Dialog open={editTarget !== null} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>患者情報の編集</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="flex flex-col gap-4 pt-2">
              <PatientFormFields
                form={editForm}
                onChange={(f) => setEditForm(f)}
              />
              {editError && (
                <p className="text-sm text-destructive">{editError}</p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={editing}>
                  {editing ? '保存中...' : '保存する'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 削除確認ダイアログ */}
        <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>患者の削除</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{deleteTarget?.anonymous_code}</span> を削除しますか？
              この操作は元に戻せません。関連する評価データもすべて削除されます。
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '削除中...' : '削除する'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>患者一覧</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                読み込み中...
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <UserIcon className="size-10 opacity-30" />
                <p className="text-sm">患者が登録されていません</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>患者ID</TableHead>
                    <TableHead>性別</TableHead>
                    <TableHead>年齢</TableHead>
                    <TableHead>病名</TableHead>
                    <TableHead>入院日</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/patients/${patient.id}`)}
                    >
                      <TableCell className="font-medium">
                        {patient.anonymous_code}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {patient.gender ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {patient.age != null ? `${patient.age}歳` : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {patient.diagnosis ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(patient.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => openEdit(patient, e)}
                            className="gap-1.5"
                          >
                            <PencilIcon className="size-3.5" />
                            編集
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(patient)
                            }}
                            className="gap-1.5 text-destructive hover:text-destructive"
                          >
                            <Trash2Icon className="size-3.5" />
                            削除
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/patients/${patient.id}`)
                            }}
                          >
                            詳細
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PatientFormFields({
  form,
  onChange,
}: {
  form: PatientForm
  onChange: (form: PatientForm) => void
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="anonymous_code">
          患者ID <span className="text-destructive">*</span>
        </label>
        <input
          id="anonymous_code"
          type="text"
          placeholder="例: PT-001"
          value={form.anonymous_code}
          onChange={(e) => onChange({ ...form, anonymous_code: e.target.value })}
          className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          required
        />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="gender">
            性別
          </label>
          <select
            id="gender"
            value={form.gender}
            onChange={(e) => onChange({ ...form, gender: e.target.value })}
            className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">未設定</option>
            <option value="男性">男性</option>
            <option value="女性">女性</option>
            <option value="その他">その他</option>
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="age">
            年齢
          </label>
          <input
            id="age"
            type="number"
            min={0}
            max={150}
            placeholder="例: 45"
            value={form.age}
            onChange={(e) => onChange({ ...form, age: e.target.value })}
            className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="diagnosis">
          病名
        </label>
        <input
          id="diagnosis"
          type="text"
          placeholder="例: うつ病"
          value={form.diagnosis}
          onChange={(e) => onChange({ ...form, diagnosis: e.target.value })}
          className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="notes">
          メモ
        </label>
        <textarea
          id="notes"
          placeholder="任意のメモ"
          value={form.notes}
          onChange={(e) => onChange({ ...form, notes: e.target.value })}
          rows={3}
          className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
        />
      </div>
    </>
  )
}
