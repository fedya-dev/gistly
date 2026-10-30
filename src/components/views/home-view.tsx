'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Hash, Loader2, LockKeyhole, Plus, Search, SearchX, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { GistCard } from '@/components/gist-card'
import { useI18n } from '@/components/i18n-provider'
import { useAuth } from '@/lib/auth-store'
import { listGists, listTags } from '@/lib/api-client'
import type { GistSummaryDTO } from '@/lib/gist'
import type { Navigation } from '@/lib/use-route'

interface HomeViewProps {
  nav: Navigation
  query: { q: string; tag: string }
  onOpenLogin: () => void
}

export function HomeView({ nav, query, onOpenLogin }: HomeViewProps) {
  const { t } = useI18n()
  const isAdmin = useAuth((s) => s.isAdmin)
  const loaded = useAuth((s) => s.loaded)

  const [gists, setGists] = useState<GistSummaryDTO[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [tagCloud, setTagCloud] = useState<{ name: string; count: number }[]>([])
  const [search, setSearch] = useState(query.q)
  const [seenQuery, setSeenQuery] = useState(query.q)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchSeq = useRef(0)

  // Sync the input when the route changes (adjusting state during render, per React docs)
  if (seenQuery !== query.q) {
    setSeenQuery(query.q)
    setSearch(query.q)
  }

  // Page 1 — (re)fetch whenever the query or tag filter changes.
  useEffect(() => {
    const seq = ++fetchSeq.current
    listGists({ q: query.q, tag: query.tag, page: 1 })
      .then((data) => {
        if (fetchSeq.current !== seq) return
        setLoadingMore(false)
        setGists(data.gists)
        setTotal(data.total)
        setHasMore(data.hasMore)
        setPage(1)
        setError(false)
      })
      .catch(() => {
        if (fetchSeq.current !== seq) return
        setLoadingMore(false)
        setError(true)
      })
  }, [query.q, query.tag])

  // Tag cloud comes from the server so it stays complete with pagination.
  useEffect(() => {
    if (query.q || query.tag) return
    let alive = true
    listTags()
      .then((data) => {
        if (alive) setTagCloud(data.tags)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [query.q, query.tag, isAdmin])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const seq = ++fetchSeq.current
    const next = page + 1
    listGists({ q: query.q, tag: query.tag, page: next })
      .then((data) => {
        if (fetchSeq.current !== seq) return
        setGists((prev) => (prev ? [...prev, ...data.gists] : data.gists))
        setTotal(data.total)
        setHasMore(data.hasMore)
        setPage(next)
      })
      .catch(() => {
        if (fetchSeq.current !== seq) return
        setError(true)
      })
      .finally(() => {
        if (fetchSeq.current === seq) setLoadingMore(false)
      })
  }

  const onSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      nav.home({ q: value, tag: query.tag, replace: true })
    }, 350)
  }

  const clearTag = () => nav.home({ q: query.q, tag: '', replace: true })

  const hasQuery = Boolean(query.q || query.tag)

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div
          className="hero-glow left-[8%] top-[-90px] h-64 w-64 bg-violet-500/40 dark:bg-violet-600/30"
          aria-hidden="true"
        />
        <div
          className="hero-glow right-[4%] top-[-40px] h-56 w-56 bg-fuchsia-400/30 dark:bg-fuchsia-500/20"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pb-12 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.21, 1.02, 0.73, 1] }}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t('home.hero.badge')}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t('home.hero.title1')}{' '}
              <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                {t('home.hero.title2')}
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
              {t('home.hero.sub')}
            </p>

            <div className="relative mx-auto mt-7 max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('home.search.placeholder')}
                className="h-12 rounded-xl bg-card/80 pl-11 pr-10 text-[0.95rem] shadow-lg shadow-black/5 backdrop-blur focus-visible:ring-2"
                aria-label={t('home.search.placeholder')}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
                  aria-label={t('home.search.clear')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* List */}
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10" aria-label="Gists">
        {query.tag && (
          <div className="mb-5 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('home.tagFiltered')}:</span>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1.5 rounded-full font-mono text-xs"
              onClick={clearTag}
            >
              <Hash className="h-3 w-3 text-primary" />
              {query.tag}
              <X className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        )}

        {!hasQuery && tagCloud.length > 3 && (
          <div className="mb-6 flex flex-wrap items-center gap-1.5">
            {tagCloud.map((tag) => (
              <button
                key={tag.name}
                type="button"
                onClick={() => nav.home({ tag: tag.name })}
                className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Hash className="h-3 w-3" />
                {tag.name}
                <span className="text-[0.65rem] text-muted-foreground/60">{tag.count}</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {t('form.error.generic')}
          </p>
        )}

        {!gists && !error && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-2/3" />
                <div className="mt-5 flex gap-3 border-t pt-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="ml-auto h-3 w-14" />
                </div>
              </div>
            ))}
          </div>
        )}

        {gists && gists.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
              {t('home.results', { count: total })}
            </p>
            <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gists.map((gist, i) => (
                <GistCard key={gist.id} gist={gist} index={i} nav={nav} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-9 flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 rounded-full px-7 shadow-sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  )}
                  {loadingMore ? t('common.loading') : t('home.loadMore')}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {gists.length} / {total}
                </p>
              </div>
            )}
          </>
        )}

        {gists && gists.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md rounded-2xl border border-dashed bg-card/50 p-10 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {hasQuery ? (
                <SearchX className="h-6 w-6" />
              ) : (
                <LockKeyhole className="h-6 w-6" />
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold">
              {hasQuery ? t('home.noResults.title') : t('home.empty.title')}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {hasQuery ? t('home.noResults.sub') : t('home.empty.sub')}
            </p>
            {!hasQuery && (
              <Button
                className="mt-5 gap-1.5"
                onClick={() => (isAdmin ? nav.newGist() : onOpenLogin())}
                disabled={!loaded}
              >
                <Plus className="h-4 w-4" />
                {isAdmin ? t('home.empty.cta') : t('home.empty.signIn')}
              </Button>
            )}
          </motion.div>
        )}
      </section>
    </div>
  )
}
