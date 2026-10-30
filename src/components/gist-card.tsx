'use client'

import { motion } from 'framer-motion'
import { Eye, FileCode2, Files } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { detectLanguage } from '@/lib/languages'
import { timeAgo } from '@/lib/relative-time'
import { useI18n } from '@/components/i18n-provider'
import type { GistSummaryDTO } from '@/lib/gist'
import type { Navigation } from '@/lib/use-route'
import { cn } from '@/lib/utils'

const VISIBILITY_STYLES: Record<string, string> = {
  unlisted: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25',
  secret: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/25',
}

interface GistCardProps {
  gist: GistSummaryDTO
  index: number
  nav: Navigation
}

export function GistCard({ gist, index, nav }: GistCardProps) {
  const { t, lang } = useI18n()
  const langInfo = detectLanguage(gist.firstFilename)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: [0.21, 1.02, 0.73, 1] }}
    >
      <button
        type="button"
        onClick={() => nav.gist(gist.id)}
        className="group flex h-full w-full flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
        aria-label={gist.title}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            <FileCode2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight tracking-tight group-hover:text-primary">
              {gist.title}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {gist.firstFilename}
            </p>
          </div>
          {gist.visibility !== 'public' && (
            <span
              className={cn(
                'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                VISIBILITY_STYLES[gist.visibility] ?? ''
              )}
            >
              {t(`gist.visibility.${gist.visibility}`)}
            </span>
          )}
        </div>

        {gist.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {gist.description}
          </p>
        )}

        {gist.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {gist.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10 dark:ring-white/10"
              style={{ background: langInfo.color }}
              aria-hidden="true"
            />
            {langInfo.label}
          </span>
          <span className="flex items-center gap-1">
            <Files className="h-3 w-3" />
            {t('card.files', { count: gist.fileCount })}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {t('card.views', { count: gist.views })}
          </span>
          <span className="ml-auto">{timeAgo(gist.updatedAt, lang)}</span>
        </div>
      </button>
    </motion.article>
  )
}
