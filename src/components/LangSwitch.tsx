import { cn } from 'cn'
import { type Lang, useI18n } from '@/lib/i18n'

const LANGS: Array<{ id: Lang; label: string; name: string }> = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'fr', label: 'FR', name: 'Français' },
]

export function LangSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <fieldset className="inline-flex rounded-lg border border-border p-0.5 text-xs font-medium">
      <legend className="sr-only">{t('common.language')}</legend>
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
    </fieldset>
  )
}
