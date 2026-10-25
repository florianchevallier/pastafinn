import { useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { LangSwitch } from '@/components/LangSwitch'
import { DiscMark } from '@/components/Logo'
import { ErrorNote } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useI18n } from '@/lib/i18n'
import { findServer, mayBeMixedContent, signInWithPassword, startQuickConnect } from '@/lib/jellyfin'

const LAST_SERVER = 'pastafinn.lastServer'

// Convenience only: storage can be unavailable (private mode), the form still works.
function lastServer() {
  try {
    return localStorage.getItem(LAST_SERVER) ?? ''
  } catch {
    return ''
  }
}

function rememberServer(address: string) {
  try {
    localStorage.setItem(LAST_SERVER, address)
  } catch {
    // not remembered, nothing else to do
  }
}

type Server = { url: string; name: string }

export function LoginPage() {
  const { t } = useI18n()
  const { expired } = useSearch({ from: '/login' })
  const [server, setServer] = useState<Server | null>(null)

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      {/* the disc, huge and quiet, behind the menu */}
      <DiscMark muted className="pointer-events-none absolute -right-40 -bottom-40 size-[34rem] text-foreground/[0.05] sm:-right-24" />
      <div className="absolute top-4 right-4">
        <LangSwitch />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-10">
          <DiscMark className="size-10" />
          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-balance">
            Pasta<span className="text-primary">Finn</span>
          </h1>
          <p className="mt-2 text-pretty text-muted-foreground">{t('app.tagline')}</p>
        </div>

        {expired && !server && <p className="mb-4 text-sm text-warning">{t('error.sessionExpired')}</p>}

        {server ? <SignIn server={server} onBack={() => setServer(null)} /> : <ServerStep onFound={setServer} />}

        <p className="mt-10 flex gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          {t('login.privacy')}
        </p>
      </div>
    </div>
  )
}

function ServerStep({ onFound }: { onFound: (s: Server) => void }) {
  const { t } = useI18n()
  const [address, setAddress] = useState(lastServer)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [notFound, setNotFound] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotFound(false)
    // No try/finally here: React Compiler skips components that use it.
    const found = await findServer(address)
      .catch((err: unknown) => ({ error: err }))
      .finally(() => setBusy(false))
    if (!found) return setNotFound(true)
    if ('error' in found) return setError(found.error)
    rememberServer(address.trim())
    onFound(found)
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <h2 className="text-lg font-medium">{t('login.title')}</h2>
      <div className="space-y-2">
        <Label htmlFor="server">{t('login.server')}</Label>
        <Input
          id="server"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-describedby="server-hint"
          aria-invalid={notFound || undefined}
          className="h-11 text-base"
        />
        <p id="server-hint" className="text-xs text-muted-foreground">
          {t('login.serverHint')}
        </p>
      </div>
      {notFound && (
        <p role="alert" className="text-sm text-destructive">
          {mayBeMixedContent(address) ? t('error.mixedContent') : t('login.notFound')}
        </p>
      )}
      {error != null && <ErrorNote error={error} />}
      <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={busy || !address.trim()}>
        {busy && <Loader2 className="animate-spin" aria-hidden />}
        {busy ? t('login.connecting') : t('login.connect')}
      </Button>
    </form>
  )
}

function SignIn({ server, onBack }: { server: Server; onBack: () => void }) {
  const { t } = useI18n()
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-lg font-medium">{t('login.signInTo', { server: server.name })}</h2>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft aria-hidden />
          {t('login.change')}
        </Button>
      </div>
      <Tabs defaultValue="password">
        <TabsList className="w-full">
          <TabsTrigger value="password">{t('login.password')}</TabsTrigger>
          <TabsTrigger value="qc">{t('login.quickConnect')}</TabsTrigger>
        </TabsList>
        <TabsContent value="password" className="pt-4">
          <PasswordForm server={server} />
        </TabsContent>
        <TabsContent value="qc" className="pt-4">
          <QuickConnect server={server} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PasswordForm({ server }: { server: Server }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signInWithPassword(server.url, server.name, username.trim(), password)
      void navigate({ to: '/' })
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">{t('login.username')}</Label>
        <Input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="h-11 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('login.password')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 text-base"
        />
      </div>
      {error != null && <ErrorNote error={error} />}
      <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={busy || !username.trim()}>
        {busy && <Loader2 className="animate-spin" aria-hidden />}
        {busy ? t('login.signingIn') : t('login.signIn')}
      </Button>
    </form>
  )
}

function QuickConnect({ server }: { server: Server }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [state, setState] = useState<{ code?: string; disabled?: boolean; error?: unknown }>({})

  useEffect(() => {
    const controller = new AbortController()
    startQuickConnect(server.url, server.name, controller.signal)
      .then(async (qc) => {
        if (!qc) return setState({ disabled: true })
        setState({ code: qc.code })
        await qc.done
        if (!controller.signal.aborted) void navigate({ to: '/' })
      })
      .catch((error) => !controller.signal.aborted && setState({ error }))
    return () => controller.abort()
  }, [server, navigate])

  if (state.disabled) return <p className="text-sm text-muted-foreground">{t('login.qcDisabled')}</p>
  if (state.error) return <ErrorNote error={state.error} />
  return (
    <div className="space-y-4">
      <p className="text-sm text-pretty text-muted-foreground">{t('login.qcHelp')}</p>
      <output
        aria-live="polite"
        className="block rounded-xl border border-border bg-card py-5 text-center font-mono text-4xl font-medium tracking-[0.3em] text-primary tabular"
      >
        {state.code ?? '······'}
      </output>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t('login.qcWaiting')}
      </p>
    </div>
  )
}
