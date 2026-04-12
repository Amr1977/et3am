import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ar from './locales/ar.json';

const ARABIC_COUNTRIES = [
  'SA', 'AE', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'OM',
  'PS', 'QA', 'SD', 'SY', 'TN', 'YE', 'BH', 'DJ', 'SO', 'MR'
];

async function detectLanguageByIP(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error('IP lookup failed');
    const data = await response.json().catch(() => null);
    if (!data || !data.country_code) return 'en';
    const country = data.country_code;
    
    if (country && ARABIC_COUNTRIES.includes(country)) {
      console.log('[i18n] Detected Arabic region:', country);
      return 'ar';
    }
    console.log('[i18n] Detected region:', country, '- using English');
    return 'en';
  } catch (error) {
    console.warn('[i18n] IP detection failed, using fallback:', error);
    return 'en';
  }
}

async function getInitialLanguage(): Promise<string> {
  const stored = localStorage.getItem('i18nextLng');
  if (stored && ['en', 'ar'].includes(stored)) {
    return stored;
  }
  
  // Default to Arabic unless explicitly set to English
  return 'ar';
}

getInitialLanguage().then(lang => {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
      },
      lng: lang,
      fallbackLng: 'ar',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
    });
}).catch(() => {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
      },
      lng: 'ar',
      fallbackLng: 'ar',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
    });
});

export default i18n;
