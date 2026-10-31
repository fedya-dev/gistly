'use client'

import { useEffect, useState } from 'react'
import { AppFooter } from '@/components/app-footer'
import { AppHeader } from '@/components/app-header'
import { CommandPalette } from '@/components/command-palette'
import { LoginDialog } from '@/components/login-dialog'
import { LogoMark } from '@/components/logo'
import { HomeView } from '@/components/views/home-view'
import { GistView } from '@/components/views/gist-view'
import { GistFormView } from '@/components/views/gist-form-view'
import { StatsView } from '@/components/views/stats-view'
import { useAppRoute, useMounted } from '@/lib/use-route'
import { useAuth } from '@/lib/auth-store'

export function AppRoot() {
  const { route, nav } = useAppRoute()
  const mounted = useMounted()
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginNonce, setLoginNonce] = useState(0)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const refresh = useAuth((s) => s.refresh)

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Ctrl/Cmd+K toggles the command palette from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const openLogin = () => {
    setLoginNonce((n) => n + 1)
    setLoginOpen(true)
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <LogoMark size={52} />
          </div>
          <div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-[fade-up_1s_ease-in-out_infinite_alternate] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    )
  }

  let view: React.ReactNode
  if (route.g && route.edit) {
    view = <GistFormView nav={nav} gistId={route.g} />
  } else if (route.g) {
    view = (
      <GistView
        key={`${route.g}:${route.t}`}
        nav={nav}
        id={route.g}
        token={route.t}
        onOpenLogin={openLogin}
      />
    )
  } else if (route.isNew) {
    view = <GistFormView nav={nav} />
  } else if (route.stats) {
    view = <StatsView nav={nav} />
  } else {
    view = (
      <HomeView
        nav={nav}
        query={{ q: route.q, tag: route.tag }}
        onOpenLogin={openLogin}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <AppHeader nav={nav} onOpenLogin={openLogin} onOpenPalette={() => setPaletteOpen(true)} />
      <main id="main-content" className="flex-1">
        {view}
      </main>
      <AppFooter />
      <LoginDialog key={loginNonce} open={loginOpen} onOpenChange={setLoginOpen} />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        nav={nav}
        onOpenLogin={openLogin}
      />
    </div>
  )
}
