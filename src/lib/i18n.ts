import { useSyncExternalStore } from 'react'

const en = {
  'app.tagline': 'Audio & subtitle tracks for a whole series, in one go.',
  'common.retry': 'Try again',
  'common.back': 'Back',
  'common.signOut': 'Sign out',
  'common.language': 'Language',
  'common.loading': 'Loading…',
  'error.network': 'Could not reach the server. Check the address, that the server is running, and that it allows this site (CORS).',
  'error.mixedContent':
    'This page is served over HTTPS, so the browser blocks a plain-HTTP server. Use the HTTPS address of your server, or run PastaFinn locally or with Docker.',
  'error.auth': 'Wrong username or password.',
  'error.generic': 'Something went wrong: {message}',
  'error.sessionExpired': 'Your session has expired. Sign in again.',

  'login.title': 'Connect to Jellyfin',
  'login.server': 'Server address',
  'login.serverHint': 'For example jellyfin.example.com or 192.168.1.10:8096',
  'login.connect': 'Connect',
  'login.connecting': 'Looking for the server…',
  'login.notFound': 'No Jellyfin server answered at this address.',
  'login.change': 'Change server',
  'login.signInTo': 'Sign in to {server}',
  'login.password': 'Password',
  'login.username': 'Username',
  'login.signIn': 'Sign in',
  'login.signingIn': 'Signing in…',
  'login.quickConnect': 'Quick Connect',
  'login.qcHelp': 'In a Jellyfin app where you are already signed in, open Settings › Quick Connect and enter this code:',
  'login.qcWaiting': 'Waiting for approval…',
  'login.qcDisabled': 'Quick Connect is turned off on this server.',
  'login.privacy': 'Your browser talks directly to your server. Nothing is sent anywhere else.',

  'count.season.one': '{n} season',
  'count.season.other': '{n} seasons',
  'count.episode.one': '{n} episode',
  'count.episode.other': '{n} episodes',
  'home.title': 'Libraries',
  'home.empty': 'No series or movie library is available to this account.',
  'library.search': 'Search this library',
  'library.empty': 'Nothing here.',
  'library.noResults': 'Nothing matches “{q}”.',
  'library.count': '{n} titles',

  'settings.remember': 'Jellyfin is set to forget track choices for your account, so the tracks you set here would be ignored.',
  'settings.subtitleModeNone': 'Your subtitle mode is “None”, so Jellyfin ignores remembered subtitle tracks.',
  'settings.fix': 'Fix my settings',
  'settings.fixed': 'Settings updated.',
  'settings.previousItem':
    'Tip: if a Jellyfin app still switches tracks, turn off “Set audio/subtitle track based on previous item” in that app’s playback settings.',

  'menu.reference': 'Reference episode',
  'menu.audio': 'Audio',
  'menu.subtitles': 'Subtitles',
  'menu.off': 'Off',
  'menu.noTracks': 'No tracks in this file.',
  'menu.current': 'Current',
  'menu.forced': 'Forced',
  'menu.default': 'Default',
  'menu.sdh': 'SDH',
  'menu.external': 'External',
  'menu.applyTo': 'Apply to',
  'menu.scope.episode': 'This episode',
  'menu.scope.season': 'Season {n}',
  'menu.scope.specials': 'Specials',
  'menu.scope.series': 'Whole series',
  'menu.scope.movie': 'This movie',
  'menu.keyword': 'Only use tracks whose title contains',
  'menu.keywordPlaceholder': 'e.g. SDH, Commentary',
  'menu.apply': 'Apply',
  'menu.applyN': 'Apply to {n} episodes',
  'menu.cancel': 'Cancel',
  'menu.progress': 'Applying {done} / {total}',
  'menu.summary': '{applied} applied · {unchanged} already set · {noMatch} without a match · {failed} failed',
  'menu.cancelled': 'Stopped. Episodes already done keep their new tracks.',
  'menu.noRuntime': 'Skipped: Jellyfin does not know this file’s duration yet.',
  'menu.nothingToDo': 'Already playing with these tracks. Pick other tracks above.',

  'episodes.title': 'Episodes',
  'episodes.willGet': 'Will get',
  'episodes.noMatch': 'No match',
  'episodes.applied': 'Applied',
  'episodes.unchanged': 'Already set',
  'episodes.failed': 'Failed',
  'episodes.skipped': 'Skipped',
  'episodes.none': 'No episodes found.',
  'episodes.setReference': 'Use as reference',
} as const

export type MessageKey = keyof typeof en

const fr: Record<MessageKey, string> = {
  'app.tagline': 'Les pistes audio et sous-titres d’une série entière, en une fois.',
  'common.retry': 'Réessayer',
  'common.back': 'Retour',
  'common.signOut': 'Se déconnecter',
  'common.language': 'Langue',
  'common.loading': 'Chargement…',
  'error.network': 'Impossible de joindre le serveur. Vérifiez l’adresse, que le serveur tourne et qu’il autorise ce site (CORS).',
  'error.mixedContent':
    'Cette page est servie en HTTPS : le navigateur bloque un serveur en HTTP simple. Utilisez l’adresse HTTPS de votre serveur, ou lancez PastaFinn en local ou avec Docker.',
  'error.auth': 'Identifiant ou mot de passe incorrect.',
  'error.generic': 'Une erreur est survenue : {message}',
  'error.sessionExpired': 'Votre session a expiré. Reconnectez-vous.',

  'login.title': 'Se connecter à Jellyfin',
  'login.server': 'Adresse du serveur',
  'login.serverHint': 'Par exemple jellyfin.exemple.fr ou 192.168.1.10:8096',
  'login.connect': 'Se connecter',
  'login.connecting': 'Recherche du serveur…',
  'login.notFound': 'Aucun serveur Jellyfin n’a répondu à cette adresse.',
  'login.change': 'Changer de serveur',
  'login.signInTo': 'Connexion à {server}',
  'login.password': 'Mot de passe',
  'login.username': 'Identifiant',
  'login.signIn': 'Se connecter',
  'login.signingIn': 'Connexion…',
  'login.quickConnect': 'Quick Connect',
  'login.qcHelp': 'Dans une app Jellyfin où vous êtes déjà connecté, ouvrez Paramètres › Quick Connect et saisissez ce code :',
  'login.qcWaiting': 'En attente de validation…',
  'login.qcDisabled': 'Quick Connect est désactivé sur ce serveur.',
  'login.privacy': 'Votre navigateur parle directement à votre serveur. Rien n’est envoyé ailleurs.',

  'count.season.one': '{n} saison',
  'count.season.other': '{n} saisons',
  'count.episode.one': '{n} épisode',
  'count.episode.other': '{n} épisodes',
  'home.title': 'Bibliothèques',
  'home.empty': 'Aucune bibliothèque de séries ou de films n’est accessible à ce compte.',
  'library.search': 'Rechercher dans cette bibliothèque',
  'library.empty': 'Rien ici.',
  'library.noResults': 'Aucun résultat pour « {q} ».',
  'library.count': '{n} titres',

  'settings.remember': 'Jellyfin est réglé pour oublier les choix de pistes de votre compte : les pistes choisies ici seraient ignorées.',
  'settings.subtitleModeNone': 'Votre mode de sous-titres est « Aucun » : Jellyfin ignore les sous-titres mémorisés.',
  'settings.fix': 'Corriger mes réglages',
  'settings.fixed': 'Réglages mis à jour.',
  'settings.previousItem':
    'Astuce : si une app Jellyfin change encore de piste, désactivez « Définir la piste audio/sous-titres d’après l’élément précédent » dans ses réglages de lecture.',

  'menu.reference': 'Épisode de référence',
  'menu.audio': 'Audio',
  'menu.subtitles': 'Sous-titres',
  'menu.off': 'Désactivés',
  'menu.noTracks': 'Aucune piste dans ce fichier.',
  'menu.current': 'Actuelle',
  'menu.forced': 'Forcés',
  'menu.default': 'Par défaut',
  'menu.sdh': 'SME',
  'menu.external': 'Externe',
  'menu.applyTo': 'Appliquer à',
  'menu.scope.episode': 'Cet épisode',
  'menu.scope.season': 'Saison {n}',
  'menu.scope.specials': 'Bonus',
  'menu.scope.series': 'Toute la série',
  'menu.scope.movie': 'Ce film',
  'menu.keyword': 'N’utiliser que les pistes dont le titre contient',
  'menu.keywordPlaceholder': 'ex. SME, Commentaire',
  'menu.apply': 'Appliquer',
  'menu.applyN': 'Appliquer à {n} épisodes',
  'menu.cancel': 'Annuler',
  'menu.progress': 'Application {done} / {total}',
  'menu.summary': '{applied} appliqués · {unchanged} déjà réglés · {noMatch} sans correspondance · {failed} en échec',
  'menu.cancelled': 'Arrêté. Les épisodes déjà traités gardent leurs nouvelles pistes.',
  'menu.noRuntime': 'Ignoré : Jellyfin ne connaît pas encore la durée de ce fichier.',
  'menu.nothingToDo': 'Ces pistes sont déjà celles utilisées. Choisissez-en d’autres ci-dessus.',

  'episodes.title': 'Épisodes',
  'episodes.willGet': 'Recevra',
  'episodes.noMatch': 'Aucune correspondance',
  'episodes.applied': 'Appliqué',
  'episodes.unchanged': 'Déjà réglé',
  'episodes.failed': 'Échec',
  'episodes.skipped': 'Ignoré',
  'episodes.none': 'Aucun épisode trouvé.',
  'episodes.setReference': 'Prendre comme référence',
}

export type Lang = 'en' | 'fr'
const dicts: Record<Lang, Record<MessageKey, string>> = { en, fr }
const plurals: Record<Lang, Intl.PluralRules> = { en: new Intl.PluralRules('en'), fr: new Intl.PluralRules('fr') }
const STORAGE_KEY = 'pastafinn.lang'

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'fr') return saved
  } catch {
    // storage unavailable (private mode): fall through to the browser language
  }
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

let current: Lang = detect()
document.documentElement.lang = current
const listeners = new Set<() => void>()

function setLang(lang: Lang) {
  current = lang
  document.documentElement.lang = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // not persisted, still applied for this visit
  }
  for (const l of listeners) l()
}

function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>) {
  return dicts[lang][key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
}

export function useI18n() {
  const lang = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
  return {
    lang,
    setLang,
    t: (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    /** Pluralized count, e.g. count('season', 3) → "3 seasons". */
    count: (noun: 'season' | 'episode', n: number) =>
      translate(lang, `count.${noun}.${plurals[lang].select(n) === 'one' ? 'one' : 'other'}`, { n }),
  }
}
