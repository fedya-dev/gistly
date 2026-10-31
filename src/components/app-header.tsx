'use client'

import { BarChart3, Github, LogIn, LogOut, Moon, Plus, Search, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoMark } from '@/components/logo'
import { useI18n } from '@/components/i18n-provider'
import { useAuth } from '@/lib/auth-store'
import { GITHUB_REPO_URL } from '@/lib/site'
import { useMounted } from '@/lib/use-route'
import type { Navigation } from '@/lib/use-route'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  nav: Navigation
  onOpenLogin: () => void
  onOpenPalette: () => void
}

export function AppHeader({ nav, onOpenLogin, onOpenPalette }: AppHeaderProps) {
  const { t, lang, toggleLang } = useI18n()
  const { isAdmin } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => nav.home()}
          className="group flex items-center gap-2.5 rounded-lg px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Gistly — Home"
        >
          <LogoMark size={28} className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105" />
          <span className="text-[1.05rem] font-bold tracking-tight">Gistly</span>
        </button>

        <nav className="ml-2 hidden items-center sm:flex" aria-label="Main">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => nav.home()}
          >
            {t('nav.home')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => nav.stats()}
          >
            <BarChart3 className="h-4 w-4" />
            {t('nav.stats')}
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 rounded-full pr-1.5 font-normal text-muted-foreground hover:text-foreground"
            onClick={onOpenPalette}
            aria-label={t('palette.title')}
            title={t('palette.title')}
          >
            <Search className="h-3.5 w-3.5" />
            <kbd className="pointer-events-none hidden select-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex sm:items-center">
              Ctrl K
            </kbd>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub — fedya-dev/gistly"
              title="GitHub — fedya-dev/gistly"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="h-8 gap-1.5 px-2 font-mono text-xs font-semibold text-muted-foreground hover:text-foreground"
            aria-label="Toggle language / Смяна на езика"
            title="EN / BG"
          >
            <span className={cn(lang === 'en' ? 'text-foreground' : 'text-muted-foreground/60')}>EN</span>
            <span className="text-border">|</span>
            <span className={cn(lang === 'bg' ? 'text-foreground' : 'text-muted-foreground/60')}>BG</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === 'light' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {isAdmin ? (
            <>
              <Button size="sm" className="h-8 gap-1.5 shadow-sm shadow-primary/25" onClick={() => nav.newGist()}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.newGist')}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                    aria-label={t('nav.admin')}
                  >
                    <span className="text-xs font-bold">A</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem className="gap-2 text-muted-foreground" disabled>
                    <span className="text-xs font-medium uppercase tracking-wider">{t('nav.admin')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive"
                    onClick={() => void useAuth.getState().logout()}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onOpenLogin}>
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('nav.signIn')}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
