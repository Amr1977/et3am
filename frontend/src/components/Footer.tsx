import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Try to import git info, fallback if missing (during first install)
let gitInfo = { commit: 'dev', date: new Date().toISOString() };
try {
    gitInfo = require('../git-info.json');
} catch (e) {
    // Ignore missing file
}

export default function Footer() {
  const { t } = useTranslation();
  const commit = gitInfo.commit;
  const date = new Date(gitInfo.date).toLocaleDateString();
  const time = new Date(gitInfo.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="brand-icon">🤲</span>
          <span>{t('app.name')}</span>
          <p className="footer-tagline">{t('app.description')}</p>
        </div>
        
        <div className="footer-links">
          <a href="https://et3am.com" target="_blank" rel="noopener noreferrer" className="footer-link">
            🌐 et3am.com
          </a>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 {t('app.name')}. All rights reserved.</p>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', fontFamily: 'monospace' }}>
            commit: {commit} | {date} {time}
          </p>
        </div>
      </div>
    </footer>
  );
}
