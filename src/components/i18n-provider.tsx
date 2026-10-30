'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { translate, type Lang } from '@/lib/i18n-dicts'

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'gistly-lang'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    // Lazy initializer: safe because nothing lang-dependent is rendered pre-mount
    if (typeof window === 'undefined') return 'en'
    return window.localStorage.getItem(STORAGE_KEY) === 'bg' ? 'bg' : 'en'
  })

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((current) => {
      const next: Lang = current === 'en' ? 'bg' : 'en'
      window.localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.lang = next
      return next
    })
  }, [])

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang, toggleLang]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
