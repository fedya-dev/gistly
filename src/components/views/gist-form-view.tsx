'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Globe,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/components/i18n-provider'
import { useAuth } from '@/lib/auth-store'
import { createGist, fetchGist, updateGist } from '@/lib/api-client'
import { copyText } from '@/lib/clipboard'
import { detectLanguage } from '@/lib/languages'
import { buildGistUrl, parseTags, type Visibility } from '@/lib/gist'
import type { Navigation } from '@/lib/use-route'
import { cn } from '@/lib/utils'

interface EditorFile {
  key: string
  filename: string
  content: string
}

interface GistFormViewProps {
  nav: Navigation
  /** set when editing an existing gist */
  gistId?: string
}

const EMPTY_FILE = (): EditorFile => ({
  key: Math.random().toString(36).slice(2),
  filename: '',
  content: '',
})

const VISIBILITY_OPTIONS: {
  value: Visibility
  icon: React.ElementType
  labelKey: string
  descKey: string
  accent: string
}[] = [
  { value: 'public', icon: Globe, labelKey: 'form.visibility.public', descKey: 'form.visibility.public.desc', accent: 'text-emerald-500' },
  { value: 'unlisted', icon: EyeOff, labelKey: 'form.visibility.unlisted', descKey: 'form.visibility.unlisted.desc', accent: 'text-amber-500' },
  { value: 'secret', icon: ShieldCheck, labelKey: 'form.visibility.secret', descKey: 'form.visibility.secret.desc', accent: 'text-rose-500' },
]

export function GistFormView({ nav, gistId }: GistFormViewProps) {
  const { t } = useI18n()
  const isAdmin = useAuth((s) => s.isAdmin)
  const loaded = useAuth((s) => s.loaded)

  const isEdit = Boolean(gistId)
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [files, setFiles] = useState<EditorFile[]>([EMPTY_FILE()])
  const contentRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  useEffect(() => {
    if (!gistId) return
    let alive = true
    fetchGist(gistId)
      .then(({ gist }) => {
        if (!alive) return
        setTitle(gist.title)
        setDescription(gist.description)
        setTagsInput(gist.tags.join(', '))
        setVisibility(gist.visibility)
        setFiles(
          gist.files.map((f) => ({
            key: f.id,
            filename: f.filename,
            content: f.content,
          }))
        )
        setLoading(false)
      })
      .catch(() => {
        if (alive) {
          setLoadError(true)
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [gistId])

  const parsedTags = parseTags(tagsInput)

  const updateFile = (key: string, patch: Partial<EditorFile>) => {
    setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)))
  }

  const addFile = () => setFiles((prev) => [...prev, EMPTY_FILE()])

  const removeFile = (key: string) => {
    setFiles((prev) => (prev.length > 1 ? prev.filter((f) => f.key !== key) : prev))
  }

  const moveFile = (index: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  /** Tab inserts two spaces instead of leaving the textarea. */
  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>, key: string) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = contentRefs.current[key]
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const value = el.value
    el.value = value.slice(0, start) + '  ' + value.slice(end)
    el.selectionStart = el.selectionEnd = start + 2
    updateFile(key, { content: el.value })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    const cleanFiles = files
      .map((f) => ({ filename: f.filename.trim(), content: f.content }))
      .filter((f) => f.filename && f.content.trim())

    if (!title.trim()) {
      toast.error(t('form.error.title'))
      return
    }
    if (cleanFiles.length === 0) {
      toast.error(t('form.error.files'))
      return
    }

    setSaving(true)
    const payload = {
      title: title.trim(),
      description: description.trim(),
      visibility,
      tags: parsedTags,
      files: cleanFiles,
    }
    try {
      if (isEdit && gistId) {
        await updateGist(gistId, payload)
        toast.success(t('form.updatedToast'))
        nav.gist(gistId)
      } else {
        const { gist } = await createGist(payload)
        if (await copyText(buildGistUrl(gist))) {
          toast.success(t('form.createdToast'))
        } else {
          toast.success(t('form.updatedToast'))
        }
        nav.gist(gist.id, gist.visibility === 'secret' ? gist.secretToken : undefined)
      }
    } catch (err) {
      const message = err instanceof Error && err.message === 'Unauthorized' ? t('login.error') : t('form.error.generic')
      toast.error(t('toast.error'), { description: message })
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex justify-center py-32 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{t('login.title')}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('login.desc')}</p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => nav.home()}>
          <ArrowLeft className="h-4 w-4" />
          {t('gist.back')}
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-9 w-1/2 rounded-md bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">{t('gist.notFound.title')}</h1>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => nav.home()}>
          <ArrowLeft className="h-4 w-4" />
          {t('gist.back')}
        </Button>
      </div>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 1.02, 0.73, 1] }}
      onSubmit={submit}
      className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => (isEdit && gistId ? nav.gist(gistId) : nav.home())}
      >
        <ArrowLeft className="h-4 w-4" />
        {isEdit ? t('gist.back') : t('nav.home')}
      </Button>

      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        {isEdit ? t('form.edit.title') : t('form.new.title')}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{t('form.new.sub')}</p>

      <div className="mt-7 space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="gist-title" className="text-sm font-medium">
            {t('form.title.label')}
          </Label>
          <Input
            id="gist-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('form.title.placeholder')}
            className="h-11 text-base"
            maxLength={160}
            autoFocus={!isEdit}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="gist-desc" className="text-sm font-medium">
            {t('form.desc.label')} <span className="font-normal text-muted-foreground">({t('form.desc.optional')})</span>
          </Label>
          <Textarea
            id="gist-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('form.desc.placeholder')}
            rows={2}
            className="resize-none"
            maxLength={600}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="gist-tags" className="text-sm font-medium">
            {t('form.tags.label')}
          </Label>
          <Input
            id="gist-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder={t('form.tags.placeholder')}
            className="font-mono text-sm"
          />
          {parsedTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {parsedTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 font-mono text-xs text-muted-foreground"
                >
                  #{tag}
                  <button
                    type="button"
                    className="hover:text-destructive"
                    onClick={() => setTagsInput(tagsInput.replace(new RegExp(`#?${tag}`, 'i'), ''))}
                    aria-label={`${t('form.file.remove')}: #${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t('form.tags.hint')}</p>
          )}
        </div>

        {/* Visibility */}
        <div className="grid gap-2">
          <Label className="text-sm font-medium">{t('form.visibility.label')}</Label>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t('form.visibility.label')}>
            {VISIBILITY_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const selected = visibility === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setVisibility(opt.value)}
                  className={cn(
                    'rounded-xl border p-3.5 text-left transition-all focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'border-primary/60 bg-primary/8 ring-1 ring-primary/40'
                      : 'bg-card hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', selected ? opt.accent : 'text-muted-foreground')} />
                    <span className="text-sm font-semibold">{t(opt.labelKey)}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t(opt.descKey)}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Files */}
        <div className="space-y-3">
          {files.map((file, index) => {
            const langInfo = detectLanguage(file.filename)
            return (
              <div key={file.key} className="rounded-xl border bg-card">
                <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <Input
                    value={file.filename}
                    onChange={(e) => updateFile(file.key, { filename: e.target.value })}
                    placeholder={`main${index === 0 ? '' : index + 1}.${langInfo.id === 'text' ? 'txt' : 'ts'}`}
                    className="h-8 w-44 flex-1 border-0 bg-transparent px-1 font-mono text-sm shadow-none focus-visible:ring-0 sm:w-56"
                    aria-label={t('form.file.name')}
                  />
                  {file.filename.trim() && (
                    <span className="flex items-center gap-1.5 rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: langInfo.color }}
                        aria-hidden="true"
                      />
                      {langInfo.label}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => moveFile(index, -1)}
                      disabled={index === 0}
                      aria-label={t('form.file.moveUp')}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => moveFile(index, 1)}
                      disabled={index === files.length - 1}
                      aria-label={t('form.file.moveDown')}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeFile(file.key)}
                      disabled={files.length === 1}
                      aria-label={t('form.file.remove')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  ref={(el) => {
                    contentRefs.current[file.key] = el
                  }}
                  value={file.content}
                  onChange={(e) => updateFile(file.key, { content: e.target.value })}
                  onKeyDown={(e) => handleTab(e, file.key)}
                  placeholder={t('form.file.code') + '…'}
                  className="scroll-slim min-h-[280px] resize-y rounded-t-none border-0 bg-zinc-50 font-mono text-[0.84rem] leading-relaxed focus-visible:ring-0 dark:bg-[#0d1117]"
                  spellCheck={false}
                  aria-label={`${t('form.file.code')} — ${t('form.file.name')}`}
                />
              </div>
            )
          })}

          <button
            type="button"
            onClick={addFile}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <FilePlus2 className="h-4 w-4" />
            {t('form.file.add')}
          </button>
          <p className="text-center text-xs text-muted-foreground">{t('form.file.hint')}</p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 border-t pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (isEdit && gistId ? nav.gist(gistId) : nav.home())}
          >
            {t('form.cancel')}
          </Button>
          <Button type="submit" disabled={saving} className="min-w-36 gap-2 shadow-sm shadow-primary/25">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? t('form.saving') : t('form.save')}
          </Button>
        </div>
      </div>
    </motion.form>
  )
}
