import { formatDistanceToNowStrict } from 'date-fns'
import { bg, enUS } from 'date-fns/locale'
import type { Lang } from '@/lib/i18n-dicts'

export function timeAgo(date: string | Date, lang: Lang): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNowStrict(d, {
    addSuffix: true,
    locale: lang === 'bg' ? bg : enUS,
  })
}
