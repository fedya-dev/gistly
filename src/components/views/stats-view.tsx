'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  Braces,
  Eye,
  FileCode2,
  Files,
  Hash,
  Languages as LanguagesIcon,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/components/i18n-provider'
import { useAuth } from '@/lib/auth-store'
import { fetchStats, type StatsDTO } from '@/lib/api-client'
import { languageMeta } from '@/lib/languages'
import { timeAgo } from '@/lib/relative-time'
import type { Navigation } from '@/lib/use-route'

interface StatsViewProps {
  nav: Navigation
}

const HEAT_COLORS = [
  'bg-black/[0.07] dark:bg-white/[0.08]',
  'bg-violet-500/25',
  'bg-violet-500/45',
  'bg-violet-500/65',
  'bg-violet-500',
]

const VISIBILITY_DOT: Record<string, string> = {
  public: 'bg-emerald-500',
  unlisted: 'bg-amber-500',
  secret: 'bg-rose-500',
}

// bg-BG formats short months as numbers in some ICU builds, so label manually.
const MONTHS_BG = ['яну', 'фев', 'мар', 'апр', 'май', 'юни', 'юли', 'авг', 'сеп', 'окт', 'ное', 'дек']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(n: number, lang: string): string {
  return n.toLocaleString(lang === 'bg' ? 'bg-BG' : 'en-US')
}

interface DayCell {
  date: string
  count: number
}

export function StatsView({ nav }: StatsViewProps) {
  const { t, lang } = useI18n()
  const isAdmin = useAuth((s) => s.isAdmin)
  const [stats, setStats] = useState<StatsDTO | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    fetchStats()
      .then((data) => {
        if (alive) setStats(data)
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [isAdmin])

  // Chunk the contiguous day list into week columns (weeks start on Sunday).
  const weeks = useMemo<DayCell[][]>(() => {
    if (!stats) return []
    const out: DayCell[][] = []
    for (let i = 0; i < stats.activity.length; i += 7) {
      out.push(stats.activity.slice(i, i + 7))
    }
    return out
  }, [stats])

  const maxHeat = useMemo(
    () => (stats ? Math.max(1, ...stats.activity.map((a) => a.count)) : 1),
    [stats]
  )
  const heatTotal = useMemo(
    () => (stats ? stats.activity.reduce((s, a) => s + a.count, 0) : 0),
    [stats]
  )

  const monthFormatter = useMemo(
    () => (date: Date) =>
      (lang === 'bg' ? MONTHS_BG : MONTHS_EN)[date.getUTCMonth()],
    [lang]
  )
  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'bg' ? 'bg-BG' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [lang]
  )

  // One month label per column when the month changes — but never closer
  // than 4 weeks to the previous label, so short months don't overlap.
  const monthLabels = useMemo<(string | null)[]>(() => {
    let last = -1
    let lastLabelWeek = -99
    return weeks.map((week, i) => {
      if (week.length === 0) return null
      const m = new Date(week[0].date + 'T00:00:00Z').getUTCMonth()
      const changed = m !== last
      last = m
      if (!changed || i - lastLabelWeek < 4) return null
      lastLabelWeek = i
      return monthFormatter.format(new Date(week[0].date + 'T00:00:00Z'))
    })
  }, [weeks, monthFormatter])

  const maxLang = stats?.languages.length ? stats.languages[0].count : 1
  const maxTag = stats?.tags.length ? stats.tags[0].count : 1

  const kpis = stats
    ? [
        { icon: FileCode2, label: t('stats.kpi.gists'), value: fmt(stats.totals.gists, lang) },
        { icon: Files, label: t('stats.kpi.files'), value: fmt(stats.totals.files, lang) },
        { icon: Braces, label: t('stats.kpi.lines'), value: fmt(stats.totals.lines, lang) },
        { icon: Eye, label: t('stats.kpi.views'), value: fmt(stats.totals.views, lang) },
      ]
    : []

  const visibilityChips = stats
    ? Object.entries(stats.visibility).filter(([, count]) => count > 0)
    : []

  const empty = stats && stats.totals.gists === 0

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => nav.backHome()}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('gist.back')}
      </Button>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('stats.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('stats.sub')}</p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {t('form.error.generic')}
        </p>
      )}

      {!stats && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      )}

      {empty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md rounded-2xl border border-dashed bg-card/50 p-10 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">{t('stats.empty.title')}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t('stats.empty.sub')}</p>
          <Button className="mt-5 gap-1.5" onClick={() => nav.newGist()} disabled={!isAdmin}>
            <Plus className="h-4 w-4" />
            {isAdmin ? t('home.empty.cta') : t('home.empty.signIn')}
          </Button>
        </motion.div>
      )}

      {stats && !empty && (
        <div className="space-y-4">
          {/* KPI cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <kpi.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{kpi.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Visibility breakdown (only when there is something besides public) */}
          {visibilityChips.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {visibilityChips.map(([vis, count]) => (
                <span
                  key={vis}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <span className={`h-2 w-2 rounded-full ${VISIBILITY_DOT[vis] ?? 'bg-muted-foreground'}`} />
                  {t(`gist.visibility.${vis}`)}
                  <span className="font-semibold text-foreground">{count}</span>
                </span>
              ))}
            </div>
          )}

          {/* Activity heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-2xl border bg-card p-5"
          >
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t('stats.heat.title')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('stats.heat.total', { count: heatTotal })}
              </p>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="flex gap-1.5">
                {/* Weekday labels */}
                <div
                  className="hidden shrink-0 gap-[3px] pt-[20px] sm:grid"
                  style={{ gridTemplateRows: 'repeat(7, 12px)' }}
                  aria-hidden="true"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="text-[9px] leading-[12px] text-muted-foreground">
                      {i === 1 ? t('stats.heat.mon') : i === 3 ? t('stats.heat.wed') : i === 5 ? t('stats.heat.fri') : ''}
                    </div>
                  ))}
                </div>

                <div className="shrink-0">
                  {/* Month labels */}
                  <div className="mb-1 flex h-4 gap-[3px]">
                    {monthLabels.map((label, i) => (
                      <div key={i} className="relative w-3">
                        {label && (
                          <span className="absolute left-0 top-0 whitespace-nowrap text-[9px] leading-4 text-muted-foreground">
                            {label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Cells */}
                  <div
                    className="grid grid-flow-col gap-[3px]"
                    style={{ gridTemplateRows: 'repeat(7, 12px)' }}
                    role="img"
                    aria-label={t('stats.heat.title')}
                  >
                    {weeks.flat().map((day, i) => {
                      const level =
                        day.count === 0
                          ? 0
                          : Math.min(4, Math.max(1, Math.ceil((day.count / maxHeat) * 4)))
                      return (
                        <div
                          key={day.date}
                          className={`h-3 w-3 rounded-[3px] ${HEAT_COLORS[level]}`}
                          title={t('stats.heat.tip', {
                            count: day.count,
                            date: dayFormatter.format(new Date(day.date + 'T00:00:00Z')),
                          })}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
              {t('stats.heat.less')}
              {HEAT_COLORS.map((c) => (
                <span key={c} className={`h-2.5 w-2.5 rounded-[2px] ${c}`} />
              ))}
              {t('stats.heat.more')}
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Languages */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="rounded-2xl border bg-card p-5"
            >
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <LanguagesIcon className="h-4 w-4 text-primary" />
                {t('stats.langs.title')}
              </h2>
              {stats.languages.length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <div className="space-y-3">
                  {stats.languages.map((l) => {
                    const meta = languageMeta(l.id)
                    return (
                      <div key={l.id} className="flex items-center gap-3 text-sm">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                          aria-hidden="true"
                        />
                        <span className="w-24 shrink-0 truncate" title={meta.label}>
                          {meta.label}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full transition-[width] duration-500"
                            style={{
                              width: `${Math.max(6, (l.count / maxLang) * 100)}%`,
                              backgroundColor: meta.color,
                              opacity: 0.85,
                            }}
                          />
                        </span>
                        <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {l.count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Top tags */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="rounded-2xl border bg-card p-5"
            >
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Hash className="h-4 w-4 text-primary" />
                {t('stats.tags.title')}
              </h2>
              {stats.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <div className="space-y-2">
                  {stats.tags.map((tag) => (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => nav.home({ tag: tag.name })}
                      className="group flex w-full items-center gap-3 rounded-lg px-1.5 py-1 text-left text-sm transition-colors hover:bg-muted/60"
                      title={t('home.tagFiltered') + ': #' + tag.name}
                    >
                      <span className="flex w-28 shrink-0 items-center gap-1 font-mono text-xs group-hover:text-primary">
                        <Hash className="h-3 w-3" />
                        {tag.name}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-500"
                          style={{ width: `${Math.max(6, (tag.count / maxTag) * 100)}%` }}
                        />
                      </span>
                      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {tag.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Highlights */}
          {(stats.mostViewed || stats.latest) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="grid gap-4 md:grid-cols-2"
            >
              {stats.mostViewed && (
                <button
                  type="button"
                  onClick={() => nav.gist(stats.mostViewed!.id)}
                  className="rounded-2xl border bg-card p-5 text-left transition-colors hover:border-primary/40"
                >
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    {t('stats.mostViewed')}
                  </p>
                  <p className="mt-2 truncate font-semibold" title={stats.mostViewed.title}>
                    {stats.mostViewed.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('card.views', { count: fmt(stats.mostViewed.views, lang) })}
                  </p>
                </button>
              )}
              {stats.latest && (
                <button
                  type="button"
                  onClick={() => nav.gist(stats.latest!.id)}
                  className="rounded-2xl border bg-card p-5 text-left transition-colors hover:border-primary/40"
                >
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {t('stats.latest')}
                  </p>
                  <p className="mt-2 truncate font-semibold" title={stats.latest.title}>
                    {stats.latest.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('gist.created', { when: timeAgo(stats.latest.createdAt, lang) })}
                  </p>
                </button>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
