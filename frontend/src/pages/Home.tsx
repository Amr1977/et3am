import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Home() {
  const { t } = useTranslation();

  const stats = [
    { number: '12,500+', label: t('home.meals_donated') },
    { number: '850+', label: t('home.active_donors') },
    { number: '9,800+', label: t('home.meals_reserved') },
  ];

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span>✨</span>
            <span>{t('app.tagline')}</span>
          </div>
          
          <h1 className="hero-title">
            {t('home.hero_title').split(', ').map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                <span className="highlight">{part}</span>
              </React.Fragment>
            ))}
          </h1>
          
          <p className="hero-subtitle">{t('home.hero_subtitle')}</p>
          
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              {t('home.get_started')}
            </Link>
            <Link to="/donations" className="btn btn-outline btn-lg">
              {t('home.learn_more')}
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-illustration">
            <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="200" cy="200" r="180" fill="url(#heroGrad)" />
              <circle cx="200" cy="200" r="140" fill="var(--bg-card)" opacity="0.9" />
              <circle cx="200" cy="200" r="100" fill="var(--primary)" opacity="0.15" />
              <text x="200" y="205" textAnchor="middle" fontSize="72">🤲</text>
              <defs>
                <radialGradient id="heroGrad" cx="0%" cy="0%" r="100%">
                  <stop offset="0%" stopColor="var(--secondary-light)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.1" />
                </radialGradient>
              </defs>
            </svg>

            <div className="floating-card c1">
              <div className="floating-card-icon food">🍽️</div>
              <div>
                <div className="floating-card-text">{t('home.step_1_title')}</div>
                <div className="floating-card-sub">{t('home.step_1_desc').slice(0, 25)}...</div>
              </div>
            </div>

            <div className="floating-card c2">
              <div className="floating-card-icon heart">❤️</div>
              <div>
                <div className="floating-card-text">{t('home.step_3_title')}</div>
                <div className="floating-card-sub">Sadaqah Jariyah</div>
              </div>
            </div>

            <div className="floating-card c3">
              <div className="floating-card-icon hands">🤝</div>
              <div>
                <div className="floating-card-text">{t('home.step_2_title')}</div>
                <div className="floating-card-sub">{t('home.step_2_desc').slice(0, 25)}...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-header">
          <span className="section-tag">{t('home.how_it_works')}</span>
          <h2 className="section-title">{t('home.how_it_works')}</h2>
          <p className="section-desc">
            A simple three-step process to feed the hungry and save food
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">🍽️</div>
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
            <div className="step-icon">🤲</div>
            <h3>{t('home.step_3_title')}</h3>
            <p>{t('home.step_3_desc')}</p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div className="stat-card" key={index}>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-card">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Make a Difference?</h2>
            <p className="cta-desc">
              Join our community of donors and recipients. Every meal shared is a blessing.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <Link to="/donations" className="btn btn-outline btn-lg">
                Browse Donations
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
