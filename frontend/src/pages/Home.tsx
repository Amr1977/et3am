import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { fetchWithFailover } from '../services/api';

interface Stats {
  totalDonations: number;
  completedDonations: number;
  totalUsers: number;
}

export default function Home() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users/public-stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k+`;
    return `${num}+`;
  };

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
          <div className="stat-card">
            {loading ? (
              <div className="stat-number">...</div>
            ) : (
              <div className="stat-number">{formatNumber(stats?.completedDonations || 0)}</div>
            )}
            <div className="stat-label">{t('home.meals_donated')}</div>
          </div>
          <div className="stat-card">
            {loading ? (
              <div className="stat-number">...</div>
            ) : (
              <div className="stat-number">{formatNumber(stats?.totalUsers || 0)}</div>
            )}
            <div className="stat-label">{t('home.active_donors')}</div>
          </div>
          <div className="stat-card">
            {loading ? (
              <div className="stat-number">...</div>
            ) : (
              <div className="stat-number">{formatNumber(stats?.totalDonations || 0)}</div>
            )}
            <div className="stat-label">{t('home.meals_reserved')}</div>
          </div>
        </div>
      </section>

      <section className="donate-section">
        <div className="donate-card">
          <div className="donate-content">
            <span className="donate-tag">Support Our Mission</span>
            <h2 className="donate-title">Help Us Feed More</h2>
            <p className="donate-desc">
              Your donations help us continue our mission of feeding the hungry. 
              Every contribution makes a difference.
            </p>
            
            <div className="instapay-options">
              <div className="instapay-option">
                <div className="instapay-label">Development Support</div>
                <div className="instapay-number">+201094450141</div>
                <div className="instapay-name">Amr Lotfy</div>
              </div>
              <div className="instapay-divider"></div>
              <div className="instapay-option">
                <div className="instapay-label">Donations for Feeding</div>
                <div className="instapay-number">+201206410261</div>
                <div className="instapay-name">Amr Lotfy</div>
              </div>
            </div>
            
            <p className="donate-thanks">JazakAllah Khair for your support! 🤲</p>
          </div>
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
