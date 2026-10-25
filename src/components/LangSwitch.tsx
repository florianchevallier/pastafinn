import { useI18n, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LANGS: Array<{ id: Lang; label: string; name: string }> = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'fr', label: 'FR', name: 'Français' },
]

export function LangSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div role="group" aria-label={t('common.language')} className="inline-flex rounded-lg border border-border p-0.5 text-xs font-medium">
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          aria-label={l.name}
          aria-pressed={lang === l.id}
          onClick={() => setLang(l.id)}
          className={cn(
            'rounded-md px-2 py-1 transition-colors',
            lang === l.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
