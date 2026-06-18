import { useTranslation } from 'react-i18next';

let gitInfo = { commit: 'dev', date: new Date().toISOString() };
try {
    gitInfo = require('../git-info.json');
} catch (e) {
}

export default function Footer() {
  const { t } = useTranslation();
  const commit = gitInfo.commit;
  const date = new Date(gitInfo.date).toLocaleDateString();
  const time = new Date(gitInfo.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand-col">
            <span className="footer-brand">{t('app.name')}</span>
            <p className="footer-tagline">{t('app.description')}</p>
          </div>

          <div className="footer-col">
            <h4>{t('footer.links')}</h4>
            <a href="https://et3am.com" target="_blank" rel="noopener noreferrer">
              et3am.com
            </a>
          </div>

          <div className="footer-col">
            <h4>{t('footer.creator')}</h4>
            <a href="https://amrlotfy.et3am.com" target="_blank" rel="noopener noreferrer">
              Amr Lotfy
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {t('app.name')}. {t('footer.rights')}</p>
          <p className="footer-commit">
            commit: {commit} | {date} {time}
          </p>
        </div>
      </div>
    </footer>
  );
}
