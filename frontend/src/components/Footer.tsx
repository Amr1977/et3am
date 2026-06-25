import { Link } from 'react-router-dom';
import gitInfo from '../git-info.json';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-bottom">
          <Link to="/support">ادعم المشروع</Link>
          <span className="sep">|</span>
          <Link to="/about">من نحن</Link>
          <span className="sep">|</span>
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
