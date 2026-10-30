'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  Link2,
  Pencil,
  RefreshCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeView } from '@/components/code-view'
import { MarkdownView } from '@/components/markdown-view'
import { useI18n } from '@/components/i18n-provider'
import { useAuth } from '@/lib/auth-store'
import { deleteGist, fetchGist, rawFileUrl } from '@/lib/api-client'
import { detectLanguage, formatBytes } from '@/lib/languages'
import { timeAgo } from '@/lib/relative-time'
import type { GistDetailDTO } from '@/lib/gist'
import type { Navigation } from '@/lib/use-route'
import { cn } from '@/lib/utils'

interface GistViewProps {
  nav: Navigation
  id: string
  token: string
  onOpenLogin: () => void
}

export function GistView({ nav, id, token, onOpenLogin }: GistViewProps) {
  const { t, lang } = useI18n()
  const isAdmin = useAuth((s) => s.isAdmin)

  const [gist, setGist] = useState<GistDetailDTO | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [activeFile, setActiveFile] = useState(0)

  useEffect(() => {
    let alive = true
    fetchGist(id, token || undefined)
      .then((data) => {
        if (!alive) return
        setGist(data.gist)
        setState('ready')
      })
      .catch((err: Error & { status?: number }) => {
        if (!alive) return
        setState(err.status === 404 ? 'notfound' : 'error')
      })
    return () => {
      alive = false
    }
  }, [id, token])

  const file = gist?.files[activeFile] ?? gist?.files[0]
  const langInfo = useMemo(() => detectLanguage(file?.filename ?? ''), [file?.filename])
  const isMarkdown = langInfo.id === 'markdown'

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      toast.success(t('gist.linkCopied'))
      setTimeout(() => setCopiedLink(false), 1800)
    } catch {
      toast.error(t('toast.error'))
    }
  }

  const remove = async () => {
    if (!gist) return
    try {
      await deleteGist(gist.id)
      toast.success(t('toast.deleted'), { description: t('toast.deletedDesc') })
      nav.home()
    } catch {
      toast.error(t('toast.error'))
    }
  }

  if (state === 'loading') {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-6 h-8 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/2" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="mt-6 h-[380px] w-full rounded-xl" />
      </div>
    )
  }

  if (state === 'notfound' || state === 'error' || !gist) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <EyeOff className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{t('gist.notFound.title')}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('gist.notFound.sub')}</p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => nav.home()}>
          <ArrowLeft className="h-4 w-4" />
          {t('gist.notFound.cta')}
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 1.02, 0.73, 1] }}
      className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8"
    >
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => nav.home()}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('gist.back')}
      </Button>

      {/* Header */}
      <header className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{gist.title}</h1>
            {gist.description && (
              <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
                {gist.description}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 gap-1.5 px-2.5 py-1',
              gist.visibility === 'public' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              gist.visibility === 'unlisted' && 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
              gist.visibility === 'secret' && 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
            )}
          >
            {gist.visibility === 'secret' ? (
              <ShieldCheck className="h-3 w-3" />
            ) : gist.visibility === 'unlisted' ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
            {t(`gist.visibility.${gist.visibility}`)}
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            {t('gist.created', { when: timeAgo(gist.createdAt, lang) })}
          </span>
          <span className="flex items-center gap-1.5">
            <RefreshCcw className="h-3.5 w-3.5" />
            {t('gist.updated', { when: timeAgo(gist.updatedAt, lang) })}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {gist.views}
          </span>
        </div>

        {gist.tags.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {gist.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => nav.home({ tag })}
                className="flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={copyLink}
            aria-live="polite"
          >
            {copiedLink ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            {t('gist.copyLink')}
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => nav.editGist(gist.id)}>
                <Pencil className="h-3.5 w-3.5" />
                {t('gist.edit')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('gist.delete')}
              </Button>
            </>
          )}
        </div>

        {gist.visibility === 'secret' && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t('gist.secretHint')}
          </p>
        )}
      </header>

      {/* Files */}
      <section className="mt-6">
        {gist.files.length > 1 && (
          <Tabs value={String(activeFile)} onValueChange={(v) => setActiveFile(Number(v))} className="gap-0">
            <TabsList className="mb-3 h-auto flex-wrap justify-start gap-1 bg-muted/60 p-1">
              {gist.files.map((f, i) => {
                const info = detectLanguage(f.filename)
                return (
                  <TabsTrigger
                    key={f.id}
                    value={String(i)}
                    className="gap-1.5 px-3 py-1.5 font-mono text-xs data-[state=active]:bg-background"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: info.color }}
                      aria-hidden="true"
                    />
                    {f.filename}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {gist.files.map((f, i) => (
              <TabsContent key={f.id} value={String(i)} className="mt-0">
                <FileBlock gist={gist} fileIndex={i} nav={nav} token={token} />
              </TabsContent>
            ))}
          </Tabs>
        )}
        {gist.files.length === 1 && <FileBlock gist={gist} fileIndex={0} nav={nav} token={token} />}
      </section>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('gist.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('gist.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('gist.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                setConfirmDelete(false)
                void remove()
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {t('gist.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

function FileBlock({
  gist,
  fileIndex,
  token,
}: {
  gist: GistDetailDTO
  fileIndex: number
  nav: Navigation
  token: string
}) {
  const { t } = useI18n()
  const [preview, setPreview] = useState(true)
  const file = gist.files[fileIndex]
  if (!file) return null

  const langInfo = detectLanguage(file.filename)
  const isMarkdown = langInfo.id === 'markdown'
  const lines = file.content.split('\n').length

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-t-xl border border-b-0 bg-muted/50 px-4 py-2.5">
        <FileCode2 className="h-4 w-4 shrink-0 text-primary" />
        <span className="font-mono text-sm font-medium">{file.filename}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: langInfo.color }}
            aria-hidden="true"
          />
          {langInfo.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {t('gist.lines', { count: lines })} · {formatBytes(new Blob([file.content]).size)}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => window.open(rawFileUrl(gist.id, file.id, { token: token || undefined }), '_blank')}
          >
            {t('gist.raw')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() =>
              window.open(rawFileUrl(gist.id, file.id, { token: token || undefined, download: true }), '_blank')
            }
          >
            <Download className="h-3.5 w-3.5" />
            {t('gist.download')}
          </Button>
        </div>
      </div>

      {isMarkdown ? (
        <>
          <div className="flex items-center gap-1 border border-b-0 bg-muted/30 px-3 pt-2">
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={cn(
                'rounded-t-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
                preview ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              role="tab"
              aria-selected={preview}
            >
              {t('gist.preview')}
            </button>
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={cn(
                'rounded-t-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
                !preview ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              role="tab"
              aria-selected={!preview}
            >
              {t('gist.source')}
            </button>
          </div>
          {preview ? (
            <div className="rounded-b-xl border bg-card px-5 py-4 sm:px-7 sm:py-6">
              <MarkdownView content={file.content} />
            </div>
          ) : (
            <CodeView code={file.content} language={file.language} className="rounded-b-xl border-t-0" />
          )}
        </>
      ) : (
        <CodeView
          key={file.id}
          code={file.content}
          language={file.language}
          className="rounded-b-xl border-t-0"
          maxHeight="none"
        />
      )}
    </div>
  )
}
