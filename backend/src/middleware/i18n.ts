import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

const locales: Record<string, any> = {};
const localesDir = path.join(__dirname, '..', 'locales');

function loadLocale(lang: string): any {
  if (!locales[lang]) {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(filePath)) {
      locales[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  }
  return locales[lang] || {};
}

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function localize(messageKey: string, lang: string = 'en'): string {
  const locale = loadLocale(lang);
  return getNestedValue(locale, messageKey) || messageKey;
}

export function i18nMiddleware(req: Request, res: Response, next: NextFunction): void {
  const lang = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
  const supportedLangs = ['en', 'ar'];
  const resolvedLang = supportedLangs.includes(lang) ? lang : 'en';

  (req as any).lang = resolvedLang;

  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    if (data && data.messageKey) {
      data.message = localize(data.messageKey, resolvedLang);
    }
    return originalJson(data);
  };

  next();
}
