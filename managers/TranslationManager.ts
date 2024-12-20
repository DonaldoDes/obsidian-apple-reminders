import en from '../i18n/locales/en';
import fr from '../i18n/locales/fr';

const locales: { [key: string]: any } = {
  en,
  fr
};

export class TranslationManager {
  private locale: string;
  private fallbackLocale = 'en';

  constructor() {
    this.locale = this.getInitialLocale();
  }

  private getInitialLocale(): string {
    return window.localStorage.getItem('language') || 
           navigator.language.split('-')[0] || 
           this.fallbackLocale;
  }

  t(key: string, vars: { [key: string]: string } = {}): string {
    try {
      const value = this.getTranslationValue(key);
      return this.interpolateVariables(value, vars);
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  private getTranslationValue(key: string): string {
    const keys = key.split('.');
    let value = locales[this.locale] || locales[this.fallbackLocale];
    
    for (const k of keys) {
      value = value[k];
      if (value === undefined) throw new Error('Key not found');
    }

    return value;
  }

  private interpolateVariables(value: string, vars: { [key: string]: string }): string {
    return value.replace(/{(\w+)}/g, (_, k) => vars[k] || '');
  }
} 