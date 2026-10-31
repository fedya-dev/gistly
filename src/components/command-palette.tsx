'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  ExternalLink,
  Home,
  Languages,
  LogIn,
  Moon,
  Plus,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useI18n } from '@/components/i18n-provider'
import { useAuth } from '@/lib/auth-store'
import { listGists } from '@/lib/api-client'
import { languageMeta } from '@/lib/languages'
import { GITHUB_REPO_URL } from '@/lib/site'
import type { GistSummaryDTO } from '@/lib/gist'
import type { Navigation } from '@/lib/use-route'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nav: Navigation
  onOpenLogin: () => void
}

export function CommandPalette({ open, onOpenChange, nav, onOpenLogin }: CommandPaletteProps) {
  const { t, lang, toggleLang } = useI18n()
  const { isAdmin } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<GistSummaryDTO[] | null>(null)
  const seqRef = useRef(0)
  const [wasOpen, setWasOpen] = useState(false)

  // Fresh state every time the palette opens (adjusting state during render,
  // per the React docs).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setSearch('')
      setResults(null)
    }
  }

  const onSearchChange = (value: string) => {
    setSearch(value)
    if (!value.trim()) setResults(null)
  }

  // Debounced server-side gist search.
  useEffect(() => {
    if (!open) return
    const q = search.trim()
    if (!q) return
    const timer = setTimeout(() => {
      const current = ++seqRef.current
      listGists({ q })
        .then((data) => {
          if (seqRef.current === current) setResults(data.gists.slice(0, 8))
        })
        .catch(() => {
          if (seqRef.current === current) setResults([])
        })
    }, 220)
    return () => clearTimeout(timer)
  }, [search, open])

  const run = (action: () => void) => {
    onOpenChange(false)
    action()
  }

  const searching = search.trim().length > 0
  const showGists = searching && results !== null && results.length > 0
  const showEmpty = searching && results !== null && results.length === 0
  const pending = searching && results === null

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('palette.title')}
      description={t('palette.title')}
      className="sm:max-w-xl"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder={t('palette.placeholder')}
          value={search}
          onValueChange={onSearchChange}
          autoFocus
        />
        <CommandList>
          {pending && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          )}

          {showGists && (
            <CommandGroup heading={t('palette.gists')}>
              {results.map((g) => {
                const meta = languageMeta(g.firstLanguage)
                return (
                  <CommandItem
                    key={g.id}
                    value={`gist-${g.id}`}
                    onSelect={() => run(() => nav.gist(g.id))}
                    className="gap-2.5"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{g.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {g.firstFilename}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {meta.id}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {showEmpty && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t('palette.noResults')}
            </div>
          )}

          {showGists && <CommandSeparator />}

          <CommandGroup heading={t('palette.actions')}>
            <CommandItem value="home" onSelect={() => run(() => nav.home())}>
              <Home className="text-muted-foreground" />
              {t('nav.home')}
            </CommandItem>
            <CommandItem value="stats" onSelect={() => run(() => nav.stats())}>
              <BarChart3 className="text-muted-foreground" />
              {t('nav.stats')}
            </CommandItem>
            {isAdmin ? (
              <CommandItem value="new-gist" onSelect={() => run(() => nav.newGist())}>
                <Plus className="text-muted-foreground" />
                {t('nav.newGist')}
              </CommandItem>
            ) : (
              <CommandItem value="sign-in" onSelect={() => run(onOpenLogin)}>
                <LogIn className="text-muted-foreground" />
                {t('nav.signIn')}
              </CommandItem>
            )}
            <CommandItem
              value="toggle-theme"
              onSelect={() =>
                run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))
              }
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="text-muted-foreground" />
              ) : (
                <Moon className="text-muted-foreground" />
              )}
              {resolvedTheme === 'dark' ? t('palette.themeLight') : t('palette.themeDark')}
            </CommandItem>
            <CommandItem value="toggle-language" onSelect={() => run(toggleLang)}>
              <Languages className="text-muted-foreground" />
              {t('palette.lang')}
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {lang === 'en' ? '→ BG' : '→ EN'}
              </span>
            </CommandItem>
            <CommandItem
              value="github"
              onSelect={() => run(() => window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer'))}
            >
              <ExternalLink className="text-muted-foreground" />
              {t('palette.github')}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
