'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, WrapText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { copyText } from '@/lib/clipboard'
import { useI18n } from '@/components/i18n-provider'

/**
 * Shiki-based code viewer with dual GitHub themes (light/dark),
 * optional line numbers and a copy button.
 */

const htmlCache = new Map<string, string>()

function escapeHtml(code: string): string {
  return code
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function toShikiLines(code: string): string {
  // Minimal highlighted fallback: escaped monospace lines
  const body = escapeHtml(code)
  return `<pre><code>${body}</code></pre>`
}

async function highlight(code: string, lang: string): Promise<string> {
  const key = `${lang}\u0000${code}`
  const cached = htmlCache.get(key)
  if (cached) return cached

  try {
    const { codeToHtml } = await import('shiki')
    try {
      const html = await codeToHtml(code, {
        lang,
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: 'light',
      })
      htmlCache.set(key, html)
      return html
    } catch {
      // Unknown grammar — retry as plain text
      const html = await codeToHtml(code, {
        lang: 'text',
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: 'light',
      })
      htmlCache.set(key, html)
      return html
    }
  } catch {
    return toShikiLines(code)
  }
}

interface CodeViewProps {
  code: string
  language: string
  showLineNumbers?: boolean
  className?: string
  maxHeight?: string
}

export function CodeView({
  code,
  language,
  showLineNumbers = true,
  className,
  maxHeight,
}: CodeViewProps) {
  const { t } = useI18n()
  const [rendered, setRendered] = useState<{ key: string; html: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [wrap, setWrap] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const langKey = useMemo(() => language || 'text', [language])
  const renderKey = useMemo(() => `${langKey}\u0000${code}`, [langKey, code])

  useEffect(() => {
    let alive = true
    highlight(code, langKey).then((html) => {
      if (alive) setRendered({ key: renderKey, html })
    })
    return () => {
      alive = false
    }
  }, [code, langKey, renderKey])

  const copy = async () => {
    if (await copyText(code)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } else {
      toast.error(t('toast.error'))
    }
  }

  return (
    <div
      className={cn(
        'group/code relative overflow-hidden rounded-lg border bg-zinc-50 dark:bg-[#0d1117]',
        className
      )}
      ref={containerRef}
    >
      <div className="absolute right-2.5 top-2.5 z-10 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover/code:opacity-100 focus-within:opacity-100 max-sm:opacity-100">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={cn('h-7 w-7 border bg-background/80 backdrop-blur', wrap && 'text-primary')}
          onClick={() => setWrap((w) => !w)}
          title={t('gist.wrap')}
          aria-label={t('gist.wrap')}
          aria-pressed={wrap}
        >
          <WrapText className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7 w-7 border bg-background/80 backdrop-blur"
          onClick={copy}
          title={t('gist.copyCode')}
          aria-label={t('gist.copyCode')}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <div
        className={cn(
          'codeblock scroll-slim overflow-auto',
          showLineNumbers && 'show-line-numbers',
          wrap && 'wrap-lines'
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {rendered && rendered.key === renderKey ? (
          <div
            className="shiki-root"
            // Shiki output is generated locally from the gist content
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
        ) : (
          <div className="min-h-24 w-full animate-pulse bg-gradient-to-b from-transparent via-muted/40 to-transparent" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
