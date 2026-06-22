import React from 'react';
import { Link } from 'react-router-dom';
import gitInfo from '../git-info.json';

const platforms = [
  {
    id: 'android',
    icon: '📱',
    name: 'Android',
    meta: 'APK',
    url: 'https://github.com/Amr1977/et3am/releases/latest/download/et3am-android.apk',
  },
  {
    id: 'windows',
    icon: '🪟',
    name: 'Windows',
    meta: 'EXE Installer',
    url: 'https://github.com/Amr1977/et3am/releases/latest/download/et3am-electron-windows.exe',
  },
  {
    id: 'macos',
    icon: '🍎',
    name: 'macOS',
    meta: 'DMG',
    url: 'https://github.com/Amr1977/et3am/releases/latest/download/et3am-electron-macos.dmg',
  },
  {
    id: 'linux',
    icon: '🐧',
    name: 'Linux',
    meta: 'AppImage',
    url: 'https://github.com/Amr1977/et3am/releases/latest/download/et3am-electron-linux.AppImage',
  },
];

export default function Downloads() {
  return (
    <div className="dl-main">
      <div className="dl-card">
        <h1>⬇ Download App</h1>
        <p className="dl-sub">Choose your platform to get the latest version</p>

        <div className="dl-grid">
          {platforms.map(function (p) {
            return (
              <a key={p.id} className={'dl-item ' + p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                <div className="dl-icon">{p.icon}</div>
                <div className="dl-name">{p.name}</div>
                <div className="dl-meta">{p.meta} &nbsp;·&nbsp; v{gitInfo.version}</div>
                <div className="dl-badge">Download</div>
              </a>
            );
          })}
        </div>

        <p className="dl-note">
          Releases are built automatically via{' '}
          <a href="https://github.com/Amr1977/et3am/actions" target="_blank" rel="noopener noreferrer">
            GitHub Actions
          </a>
        </p>

        <Link to="/" className="dl-back">&larr; Back to home</Link>
      </div>
    </div>
  );
}
