import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="brand-icon">🍽️</span>
          <span>{t('app.name')}</span>
          <p className="footer-tagline">{t('app.description')}</p>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 {t('app.name')}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
