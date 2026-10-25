import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { classifyError, getSession } from '@/lib/jellyfin'
import { useI18n } from '@/lib/i18n'

export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n()
  const kind = classifyError(error, getSession()?.serverUrl)
  const message =
    kind === 'generic' ? t('error.generic', { message: error instanceof Error ? error.message : String(error) }) : t(`error.${kind}`)
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
      <p className="flex gap-2 text-foreground">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        {message}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}

export function RouteError({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <ErrorNote error={error} onRetry={reset} />
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-16 text-center text-muted-foreground">{children}</p>
}
