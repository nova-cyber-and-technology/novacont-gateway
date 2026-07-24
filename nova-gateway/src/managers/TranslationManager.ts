/**
 * TranslationManager — Handles multi-language support.
 * All bot messages are routed through this manager for localization.
 */

type Locale = 'en' | 'tr' | 'de' | 'fr' | 'es';

// Translation dictionary (expandable)
const translations: Record<string, Record<Locale, string>> = {
  'welcome.title': {
    en: 'Welcome to NovaCont!',
    tr: 'NovaCont\'a Hosgeldiniz!',
    de: 'Willkommen bei NovaCont!',
    fr: 'Bienvenue sur NovaCont!',
    es: 'Bienvenido a NovaCont!',
  },
  'welcome.description': {
    en: 'Link your wallet to get started.',
    tr: 'Baslamak icin cuzdaninizi baglayiniz.',
    de: 'Verbinden Sie Ihre Wallet, um loszulegen.',
    fr: 'Liez votre portefeuille pour commencer.',
    es: 'Vincule su billetera para comenzar.',
  },
  'profile.not_found': {
    en: 'No profile found. Use `/linkwallet` first.',
    tr: 'Profil bulunamadi. Lutfen once `/linkwallet` kullaniniz.',
    de: 'Kein Profil gefunden. Verwenden Sie zuerst `/linkwallet`.',
    fr: 'Aucun profil trouve. Utilisez `/linkwallet` d\'abord.',
    es: 'No se encontro perfil. Use `/linkwallet` primero.',
  },
  'escrow.no_wallet': {
    en: 'This user has not linked their wallet yet.',
    tr: 'Bu kullanici henuz cuzdanini baglamamis.',
    de: 'Dieser Benutzer hat seine Wallet noch nicht verbunden.',
    fr: 'Cet utilisateur n\'a pas encore lie son portefeuille.',
    es: 'Este usuario aun no ha vinculado su billetera.',
  },
  'verify.success': {
    en: 'You have been verified successfully!',
    tr: 'Basariyla dogrulandiniz!',
    de: 'Sie wurden erfolgreich verifiziert!',
    fr: 'Vous avez ete verifie avec succes!',
    es: 'Ha sido verificado con exito!',
  },
};

export class TranslationManager {
  private defaultLocale: Locale = 'en';

  /** Get a translated string */
  t(key: string, locale?: Locale): string {
    const entry = translations[key];
    if (!entry) return key;
    return entry[locale ?? this.defaultLocale] ?? entry[this.defaultLocale] ?? key;
  }

  /** Set the default locale */
  setDefault(locale: Locale): void {
    this.defaultLocale = locale;
  }

  /** Get current default locale */
  getDefault(): Locale {
    return this.defaultLocale;
  }

  /** Get all available locales */
  getAvailableLocales(): Locale[] {
    return ['en', 'tr', 'de', 'fr', 'es'];
  }
}
