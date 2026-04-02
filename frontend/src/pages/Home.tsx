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
          <div className="hero-emoji">🍽️</div>
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">{t('home.how_it_works')}</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">📦</div>
            <h3>{t('home.step_1_title')}</h3>
            <p>{t('home.step_1_desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">🔍</div>
            <h3>{t('home.step_2_title')}</h3>
            <p>{t('home.step_2_desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">🤝</div>
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
