import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { LangSwitch } from '@/components/LangSwitch'
import { Wordmark } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/lib/i18n'
import { signOut, useSession } from '@/lib/jellyfin'

export function AppShell() {
  const { t } = useI18n()
  const session = useSession()
  const navigate = useNavigate()

  // Signed out (or token expired): render nothing while the redirect to /login happens,
  // so pages never run without an API client.
  if (!session) return null

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="rounded-md text-base">
            <Wordmark />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden truncate text-sm text-muted-foreground sm:block">
              {session.userName} · {session.serverName}
            </span>
            <LangSwitch />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('common.signOut')}
                  onClick={async () => {
                    await signOut()
                    void navigate({ to: '/login' })
                  }}
                >
                  <LogOut />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.signOut')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
