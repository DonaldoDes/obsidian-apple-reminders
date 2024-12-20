import en from './locales/en';
import fr from './locales/fr';

const locales: { [key: string]: any } = {
  en,
  fr
};

export class TranslationManager {
  private locale: string;

  constructor() {
    this.locale = window.localStorage.getItem('language') || 'en';
  }

  t(key: string, vars: { [key: string]: string } = {}): string {
    const keys = key.split('.');
    let value = locales[this.locale] || locales['en'];
    
    for (const k of keys) {
      value = value[k];
    }

    if (typeof value !== 'string') {
      return key;
    }

    return value.replace(/{(\w+)}/g, (_, k) => vars[k] || '');
  }
} 