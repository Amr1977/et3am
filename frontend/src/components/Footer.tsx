import { useTranslation } from 'react-i18next';
import gitInfo from '../git-info.json';

export default function Footer() {
  const { t } = useTranslation();

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
            <a href="/downloads">Downloads</a>
          </div>

          <div className="footer-col">
            <h4>{t('footer.creator')}</h4>
            <a href="https://amrlotfy.et3am.com" target="_blank" rel="noopener noreferrer">
              Amr Lotfy
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>v{gitInfo.version}</span>
          <span className="sep">|</span>
          <a href="https://amrlotfy.et3am.com" target="_blank" rel="noopener noreferrer">Amr Lotfy</a>
          <span className="sep">|</span>
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
}
