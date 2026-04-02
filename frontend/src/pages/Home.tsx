import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">{t('home.hero_title')}</h1>
          <p className="hero-subtitle">{t('home.hero_subtitle')}</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">{t('home.get_started')}</Link>
            <Link to="/donations" className="btn btn-outline btn-lg">{t('home.learn_more')}</Link>
          </div>
        </div>
          <div className="hero-visual">
            <div className="hero-illustration">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="90" fill="#00695C" fillOpacity="0.1"/>
                <circle cx="100" cy="100" r="70" stroke="#C9A227" strokeWidth="2" strokeDasharray="4 4"/>
                <path d="M100 50 L100 150 M50 100 L150 100" stroke="#C9A227" strokeWidth="1" opacity="0.3"/>
                <circle cx="100" cy="100" r="30" fill="#00695C"/>
                <text x="100" y="108" textAnchor="middle" fill="white" fontSize="32">🤲</text>
                <circle cx="40" cy="60" r="15" stroke="#00695C" strokeWidth="1.5" opacity="0.5"/>
                <circle cx="160" cy="140" r="15" stroke="#00695C" strokeWidth="1.5" opacity="0.5"/>
                <circle cx="160" cy="60" r="10" stroke="#C9A227" strokeWidth="1" opacity="0.4"/>
                <circle cx="40" cy="140" r="10" stroke="#C9A227" strokeWidth="1" opacity="0.4"/>
              </svg>
              <div className="decoration-circle c1"/>
              <div className="decoration-circle c2"/>
            </div>
          </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">{t('home.how_it_works')}</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">١</div>
            <div className="step-icon">🍽️</div>
            <h3>{t('home.step_1_title')}</h3>
            <p>{t('home.step_1_desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">٢</div>
            <div className="step-icon">🔍</div>
            <h3>{t('home.step_2_title')}</h3>
            <p>{t('home.step_2_desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">٣</div>
            <div className="step-icon">🤲</div>
            <h3>{t('home.step_3_title')}</h3>
            <p>{t('home.step_3_desc')}</p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <h2 className="section-title">{t('home.stats_title')}</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">1,250+</div>
            <div className="stat-label">{t('home.meals_donated')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">350+</div>
            <div className="stat-label">{t('home.active_donors')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">980+</div>
            <div className="stat-label">{t('home.meals_claimed')}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
