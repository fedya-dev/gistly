'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'

export interface Route {
  /** gist id when viewing/editing */
  g: string
  /** token for secret gists */
  t: string
  /** edit mode */
  edit: boolean
  /** new gist mode */
  isNew: boolean
  /** home search query */
  q: string
  /** home tag filter */
  tag: string
  /** insights dashboard */
  stats: boolean
}

const EMPTY: Route = { g: '', t: '', edit: false, isNew: false, q: '', tag: '', stats: false }

function parse(search: string): Route {
  const sp = new URLSearchParams(search)
  return {
    g: sp.get('g') ?? '',
    t: sp.get('t') ?? '',
    edit: sp.get('edit') === '1',
    isNew: sp.get('new') === '1',
    q: sp.get('q') ?? '',
    tag: sp.get('tag') ?? '',
    stats: sp.get('stats') === '1',
  }
}

function routeToSearch(route: Route): string {
  const sp = new URLSearchParams()
  if (route.g) sp.set('g', route.g)
  if (route.t) sp.set('t', route.t)
  if (route.edit) sp.set('edit', '1')
  if (route.isNew) sp.set('new', '1')
  if (route.q) sp.set('q', route.q)
  if (route.tag) sp.set('tag', route.tag)
  if (route.stats) sp.set('stats', '1')
  const qs = sp.toString()
  return qs ? `/?${qs}` : '/'
}

/* ---- location as an external store (works with pushState + popstate) ---- */

const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener('popstate', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('popstate', listener)
  }
}

function getSnapshot(): string {
  return window.location.search
}

function getServerSnapshot(): string {
  return ''
}

/** Programmatic navigation that also notifies subscribers. */
export function navigateToSearch(search: string, replace = false) {
  if (replace) {
    window.history.replaceState({}, '', search)
  } else {
    window.history.pushState({}, '', search)
  }
  for (const listener of listeners) listener()
}

export interface Navigation {
  home: (opts?: { q?: string; tag?: string; replace?: boolean }) => void
  gist: (id: string, token?: string) => void
  newGist: () => void
  editGist: (id: string) => void
  stats: () => void
  backHome: () => void
}

export function useAppRoute() {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const route = useMemo(() => (search === '' ? EMPTY : parse(search)), [search])

  const home = useCallback(
    (opts?: { q?: string; tag?: string; replace?: boolean }) => {
      navigateToSearch(routeToSearch({ ...EMPTY, q: opts?.q ?? '', tag: opts?.tag ?? '' }), opts?.replace ?? false)
    },
    []
  )

  const stats = useCallback(() => {
    navigateToSearch(routeToSearch({ ...EMPTY, stats: true }))
    window.scrollTo({ top: 0 })
  }, [])

  const gist = useCallback((id: string, token?: string) => {
    navigateToSearch(routeToSearch({ ...EMPTY, g: id, t: token ?? '' }))
    window.scrollTo({ top: 0 })
  }, [])

  const newGist = useCallback(() => {
    navigateToSearch(routeToSearch({ ...EMPTY, isNew: true }))
    window.scrollTo({ top: 0 })
  }, [])

  const editGist = useCallback((id: string) => {
    navigateToSearch(routeToSearch({ ...EMPTY, g: id, edit: true }))
    window.scrollTo({ top: 0 })
  }, [])

  const backHome = useCallback(() => home(), [home])

  return { route, nav: { home, gist, newGist, editGist, stats, backHome } as Navigation }
}

/** True once the app is running on the client (SSR-safe, no effects). */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  )
}
