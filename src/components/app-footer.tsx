'use client'

import { Github } from 'lucide-react'
import { LogoMark } from '@/components/logo'
import { useI18n } from '@/components/i18n-provider'
import { AUTHOR_LABEL, AUTHOR_URL, GITHUB_REPO_LABEL, GITHUB_REPO_URL } from '@/lib/site'

export function AppFooter() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-muted/25 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <LogoMark size={22} />
          <div>
            <span className="font-semibold text-foreground">Gistly</span>
            <span className="mx-2 text-border">·</span>
            {t('footer.tagline')}
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            aria-label={t('footer.githubAria')}
            title={t('footer.githubAria')}
          >
            <Github className="h-3.5 w-3.5" />
            <span className="font-mono">{GITHUB_REPO_LABEL}</span>
          </a>
          <span className="text-border">·</span>
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
            aria-label={t('footer.fediaAria')}
            title={t('footer.fediaAria')}
          >
            {AUTHOR_LABEL}
          </a>
          <span className="text-border">·</span>
          <span>© {year}</span>
        </div>
      </div>
    </footer>
  )
}
