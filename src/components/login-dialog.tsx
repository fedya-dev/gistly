'use client'

import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/components/i18n-provider'
import { useAuth } from '@/lib/auth-store'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { t } = useI18n()
  const login = useAuth((s) => s.login)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(id)
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError(false)
    try {
      await login(password)
      onOpenChange(false)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">{t('login.title')}</DialogTitle>
          <DialogDescription className="text-center">{t('login.desc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className={error ? 'animate-shake' : ''}>
          <div className="grid gap-2">
            <Label htmlFor="admin-password">{t('login.password')}</Label>
            <div className="relative">
              <Input
                id="admin-password"
                ref={inputRef}
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(false)
                }}
                className={error ? 'border-destructive pr-9' : 'pr-9'}
                autoComplete="current-password"
                aria-invalid={error}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? t('login.hide') : t('login.show')}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-sm text-destructive">{t('login.error')}</p>}
          </div>

          <Button type="submit" className="mt-4 w-full gap-2" disabled={busy || !password}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? t('login.loading') : t('login.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
