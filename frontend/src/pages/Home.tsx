import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { fetchWithFailover } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Stats {
  totalDonations: number;
  completedDonations: number;
  totalUsers: number;
  totalDonors: number;
  totalReceivers: number;
}

interface Donation {
  id: string;
  title: string;
  pickup_address: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  food_type: string;
  quantity: number;
}

const statusColors: Record<string, string> = {
  available: '#22c55e',
  reserved: '#f59e0b',
  completed: '#3b82f6',
};

function createColoredIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export default function Home() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithFailover('/api/users/public-stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(data => {
        console.log('Stats loaded:', data);
        setStats(data);
      })
      .catch(err => {
        console.error('Stats fetch error:', err);
        setStats(null);
      })
      .finally(() => setLoading(false));

    fetchWithFailover('/api/donations?status=available&limit=20')
      .then(res => res.ok ? res.json() : Promise.reject('Failed'))
      .then(data => setDonations(data.donations || []))
      .catch(err => console.error('Donations fetch error:', err));
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
            <span className="highlight">إطعام</span>
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
          <div className="hero-map">
            <MapContainer 
              center={[30.0444, 31.2357]} 
              zoom={11} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {donations.filter(d => d.latitude && d.longitude).slice(0, 15).map(d => (
                <Marker
                  key={d.id}
                  position={[d.latitude!, d.longitude!]}
                  icon={createColoredIcon(statusColors[d.status] || '#6b7280')}
                >
                  <Popup>
                    <strong>{d.title}</strong>
                    <br />
                    {d.food_type} - {d.quantity}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className="hero-map-overlay">
              <div className="hero-map-badge">
                <span>🗺️</span>
                <span>{donations.length} {t('nav.donations')}</span>
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
            {t('home.step_1_desc').split('.')[0]}.
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
            <div className="stat-label">{t('home.meals_given')}</div>
          </div>
          <div className="stat-card">
            {loading ? (
              <div className="stat-number">...</div>
            ) : (
              <div className="stat-number">{formatNumber(stats?.totalDonors || 0)}</div>
            )}
            <div className="stat-label">{t('home.total_donors')}</div>
          </div>
          <div className="stat-card">
            {loading ? (
              <div className="stat-number">...</div>
            ) : (
              <div className="stat-number">{formatNumber(stats?.totalReceivers || 0)}</div>
            )}
            <div className="stat-label">{t('home.total_receivers')}</div>
          </div>
        </div>
      </section>

      <section className="support-dev-section">
        <div className="support-dev-container">
          <div className="support-dev-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <h2 className="support-dev-title">{t('home.support_dev_title')}</h2>
          <p className="support-dev-desc">
            {t('home.support_dev_desc')}
          </p>
          
          <div className="support-phone-section">
            <span className="support-phone-label">{t('home.support_phone')}</span>
            <div className="support-phone-display">
              <span className="support-phone-number">01094450141</span>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText('01094450141')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                <span>{t('home.support_copy')}</span>
              </button>
            </div>
          </div>
          
          <div className="support-methods-list">
            <div className="support-method-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="M3 10h18"/>
              </svg>
              <span>Instapay</span>
            </div>
            <div className="support-method-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
              <span>Vodafone Cash</span>
            </div>
          </div>
          
          <p className="support-dev-thanks">{t('home.support_thanks')}</p>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-card">
          <div className="cta-content">
            <h2 className="cta-title">{t('app.name')}</h2>
            <p className="cta-desc">
              {t('app.description')}
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">
                {t('home.get_started')}
              </Link>
              <Link to="/donations" className="btn btn-outline btn-lg">
                {t('home.learn_more')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
