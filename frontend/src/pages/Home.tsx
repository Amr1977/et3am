import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { fetchWithFailover, getServerUrl } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

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

const foodIcons: Record<string, string> = {
  'meat': '🥩',
  'chicken': '🍗',
  'fish': '🐟',
  'vegetables': '🥬',
  'fruits': '🍎',
  'bread': '🍞',
  'rice': '🍚',
  'pasta': '🍝',
  'soup': '🥣',
  'dessert': '🍰',
  'other': '🍽️',
};

function getFoodIcon(type: string): string {
  const key = type.toLowerCase();
  for (const [k, v] of Object.entries(foodIcons)) {
    if (key.includes(k)) return v;
  }
  return foodIcons['other'];
}

function createMarkerIcon(color: string, foodType: string) {
  const icon = getFoodIcon(foodType);
  return L.divIcon({
    className: 'custom-marker-container',
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      ">${icon}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  let size = 'small';
  if (count > 10) size = 'medium';
  if (count > 50) size = 'large';
  
  return L.divIcon({
    html: `<div class="cluster-marker cluster-${size}"><span>${count}</span></div>`,
    className: 'marker-cluster-custom',
    iconSize: L.point(40, 40),
  });
}

const LAUNCH_DATE = new Date('2026-05-01T00:00:00');

function getDaysUntilLaunch(): number {
  const now = new Date();
  const diff = LAUNCH_DATE.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getLaunchProgress(): { days: number; percent: number } {
  const totalDays = 30;
  const daysLeft = getDaysUntilLaunch();
  const percent = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));
  return { days: daysLeft, percent };
}

export default function Home() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { playSound } = useSound();
  const [stats, setStats] = useState<Stats | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tileUrl, setTileUrl] = useState<string>('');
  const [statsChanged, setStatsChanged] = useState(false);
  const prevStatsRef = useRef<Stats | null>(null);
  const [launchInfo, setLaunchInfo] = useState(getLaunchProgress());
  const [mapFullscreen, setMapFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLaunchInfo(getLaunchProgress());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getServerUrl().then(url => {
      setTileUrl(`${url}/api/maps/tiles/{z}/{x}/{y}.png`);
    });
  }, []);

  const fetchStats = () => {
    fetchWithFailover('/api/users/public-stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(data => {
        console.log('Stats loaded:', data);
        const prevStats = prevStatsRef.current;
        if (prevStats && (prevStats.completedDonations !== data.completedDonations || 
            (prevStats.totalDonors + prevStats.totalReceivers) !== (data.totalDonors + data.totalReceivers))) {
          setStatsChanged(true);
          setTimeout(() => setStatsChanged(false), 600);
          if (isAuthenticated) {
            playSound('new_meal');
          }
        }
        prevStatsRef.current = data;
        setStats(data);
      })
      .catch(err => {
        console.error('Stats fetch error:', err);
        setStats(null);
      })
      .finally(() => setLoading(false));
  };

  const fetchDonations = () => {
    fetchWithFailover('/api/public/donations?limit=50&status=available')
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(data => {
        console.log('Donations loaded:', data);
        if (data.donations) {
          const availableDonations = data.donations.filter((d: Donation) => 
            d.status === 'available' && d.latitude && d.longitude
          );
          setDonations(availableDonations);
          console.log('Available donations with location:', availableDonations.length);
        }
      })
      .catch(err => {
        console.error('Donations fetch error:', err);
      });
  };

  useEffect(() => {
    fetchStats();
    fetchDonations();

    const statsInterval = setInterval(fetchStats, 30000);
    return () => clearInterval(statsInterval);
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
          
          {launchInfo.days > 0 && (
            <div className="launch-countdown">
              <div className="countdown-label">
                <span className="countdown-icon">🚀</span>
                <span>{t('home.launch_countdown') || 'Launching Soon'}</span>
              </div>
              <div className="countdown-display">
                <div className="countdown-number">{launchInfo.days}</div>
                <div className="countdown-unit">{t('home.days') || 'days'}</div>
              </div>
              <div className="countdown-progress">
                <div className="progress-bar" style={{ width: `${launchInfo.percent}%` }}></div>
              </div>
              <div className="countdown-percentage">{Math.round(launchInfo.percent)}% {t('home.ready') || 'ready'}</div>
            </div>
          )}
        </div>

        <div className="hero-visual">
          <div 
            className={`hero-map ${mapFullscreen ? 'fullscreen' : ''}`}
            onClick={() => !mapFullscreen && setMapFullscreen(true)}
          >
            <MapContainer 
              center={[30.0444, 31.2357]} 
              zoom={11} 
              style={{ height: '100%', width: '100%', minHeight: '300px' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url={tileUrl || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
              />
              <MarkerClusterGroup
                chunkedLoading
                spiderfyOnMaxZoom
                showCoverageOnHover={false}
                zoomToBoundsOnClick
                maxClusterRadius={40}
                disableClusteringAtZoom={15}
                iconCreateFunction={createClusterIcon}
              >
                {donations.filter(d => d.latitude && d.longitude).slice(0, 50).map(d => (
                  <Marker
                    key={d.id}
                    position={[d.latitude!, d.longitude!]}
                    icon={createMarkerIcon(statusColors[d.status] || '#6b7280', d.food_type)}
                  >
                    <Popup>
                      <strong>{d.title}</strong>
                      <br />
                      {d.food_type} - {d.quantity}
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
            {mapFullscreen && (
              <button 
                className="map-fullscreen-close"
                onClick={(e) => { e.stopPropagation(); setMapFullscreen(false); }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  zIndex: 1000,
                  background: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}
              >
                ✕
              </button>
            )}
            <div className="hero-map-overlay">
              <div className="hero-map-badge">
                <span>🎁</span>
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

        <div className="steps-flow">
          <div className="step-flow-card donor">
            <div className="step-flow-icon">🍽️</div>
            <div className="step-flow-number">1</div>
            <h3>{t('home.step_1_title')}</h3>
            <p>{t('home.step_1_desc')}</p>
            <span className="step-flow-role">{t('home.donor') || 'Donor'}</span>
          </div>
          
          <div className="step-flow-arrow">{t('home.arrow')}</div>
          
          <div className="step-flow-card receiver">
            <div className="step-flow-icon">🔍</div>
            <div className="step-flow-number">2</div>
            <h3>{t('home.step_2_title')}</h3>
            <p>{t('home.step_2_desc')}</p>
            <span className="step-flow-role">{t('home.receiver') || 'Receiver'}</span>
          </div>
          
          <div className="step-flow-arrow">{t('home.arrow')}</div>
          
          <div className="step-flow-card pickup">
            <div className="step-flow-icon">🤲</div>
            <div className="step-flow-number">3</div>
            <h3>{t('home.step_3_title')}</h3>
            <p>{t('home.step_3_desc')}</p>
            <span className="step-flow-role">{t('home.pickup') || 'Pickup'}</span>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            {loading ? (
              <div className="stat-number">...</div>
            ) : (
              <div className={`stat-number ${statsChanged ? 'stat-pulse' : ''}`}>{formatNumber(stats?.completedDonations || 0)}</div>
            )}
            <div className="stat-label">{t('home.meals_given')}</div>
          </div>
          <div className="stat-card">
            {loading ? (
              <div className="stat-number">...</div>
            ) : (
              <div className={`stat-number ${statsChanged ? 'stat-pulse' : ''}`}>{formatNumber((stats?.totalDonors || 0) + (stats?.totalReceivers || 0))}</div>
            )}
            <div className="stat-label">{t('home.total_members')}</div>
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
