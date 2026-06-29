import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWithFailover, getServerUrl, getInitialTileUrl } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import MapCenterUpdater from '../components/MapCenterUpdater';
import MapFullscreenCenterHandler from '../components/MapFullscreenCenterHandler';
import HeroMapResizeHandler from '../components/HeroMapResizeHandler';
import MapHeroInteractionHandler from '../components/MapHeroInteractionHandler';
import TestimonialsSection from '../components/TestimonialsSection';
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

interface DonationRequest {
  id: string;
  title: string;
  description: string | null;
  member_count: number;
  meals_fulfilled: number;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
}

const statusColors: Record<string, string> = {
  available: '#22c55e',
  reserved: '#f59e0b',
  completed: '#3b82f6',
};

const requestStatusColors: Record<string, string> = {
  open: '#22c55e',
  partially_fulfilled: '#f59e0b',
  fulfilled: '#3b82f6',
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

function createRequestMarkerIcon(status: string) {
  const color = requestStatusColors[status] || '#6b7280';
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
        user-select: none;
        cursor: pointer;
      ">📦</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
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
        user-select: none;
        cursor: pointer;
      ">${icon}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
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

const userLocationIcon = L.divIcon({
  className: 'user-marker-container',
  html: `
    <div class="user-marker-pulse"></div>
    <div class="user-marker-dot">
      <div class="user-marker-inner"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

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
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tileUrl, setTileUrl] = useState<string>(getInitialTileUrl());
  const [statsChanged, setStatsChanged] = useState(false);
  const prevStatsRef = useRef<Stats | null>(null);
  const [launchInfo, setLaunchInfo] = useState(getLaunchProgress());
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    try { const c = localStorage.getItem('userLocation'); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    try { const c = localStorage.getItem('userLocation'); if (c) { const p = JSON.parse(c); return [p.lat, p.lng]; } } catch { /* */ }
    return [20, 0];
  });
  const [mapZoom, setMapZoom] = useState(() => {
    const s = localStorage.getItem('mapZoom');
    return s ? parseInt(s, 10) : 12;
  });
  const [mapFilter, setMapFilter] = useState<'all' | 'donations' | 'requests'>('all');
  const mapRef = useRef<L.Map | null>(null);

  const center = useMemo(() =>
    userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : null,
    [userLocation?.lat, userLocation?.lng]
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        setMapCenter([loc.lat, loc.lng]);
        setMapZoom(12);
        localStorage.setItem('userLocation', JSON.stringify(loc));
        localStorage.setItem('mapZoom', '12');
      },
      (err) => {
        console.warn('Geolocation error (user may have denied):', err.message);
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, []);

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

  useEffect(() => {
    if (!mapFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMapFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mapFullscreen]);

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

  const fetchRequests = () => {
    fetchWithFailover('/api/requests?status=open&limit=12')
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(data => {
        if (data.requests) {
          setRequests(data.requests.filter((r: DonationRequest) => r.status === 'open'));
        }
      })
      .catch(err => {
        console.error('Requests fetch error:', err);
      });
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
    fetchRequests();

    const statsInterval = setInterval(fetchStats, 30000);
    return () => clearInterval(statsInterval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return `${num}`;
  };

  return (
    <div className={`home-page${mapFullscreen ? ' map-fullscreen' : ''}`} style={mapFullscreen ? { overflowX: 'visible' } : undefined}>
      <section className={`hero${mapFullscreen ? ' map-fullscreen' : ''}`} style={mapFullscreen ? { overflow: 'visible' } : undefined}>
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
            <Link to="/requests" className="btn btn-secondary btn-lg">
              {t('home.request_food')}
            </Link>
            <Link to="/donations" className="btn btn-outline btn-lg">
              {t('home.learn_more')}
            </Link>
            <Link to="/sadaqat" className="btn btn-gold btn-lg">
              {t('home.give_sadaqah')}
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
            style={mapFullscreen ? {
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              borderRadius: 0,
              cursor: 'default',
              background: '#fff',
              margin: 0,
              padding: 0,
              maxWidth: 'none',
              maxHeight: 'none',
              width: '100vw',
              height: '100vh',
              aspectRatio: 'auto',
              overflow: 'visible',
            } : undefined}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              // Don't fullscreen when clicking on markers, popups, or popup controls
              if (target.closest('.leaflet-marker-icon') || 
                  target.closest('.leaflet-popup') || 
                  target.closest('.leaflet-popup-close-button') ||
                  target.closest('.leaflet-control-zoom') ||
                  target.closest('.custom-marker-container')) {
                return;
              }
              if (!mapFullscreen) {
                setMapFullscreen(true);
              }
            }}
          >
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              style={{ height: '100%', width: '100%', minHeight: '300px' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url={tileUrl}
              />
              {center && (
                <MapCenterUpdater center={center} zoom={mapZoom} />
              )}
              <HeroMapResizeHandler key={mapFullscreen ? 'a' : 'b'} />
              <MapFullscreenCenterHandler isFullscreen={mapFullscreen} center={center} />
              {!mapFullscreen && <MapHeroInteractionHandler onFirstInteraction={() => setMapFullscreen(true)} />}
              {userLocation && (
                <>
                  <Marker
                    position={[userLocation.lat, userLocation.lng]}
                    icon={userLocationIcon}
                  />
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={10000}
                    pathOptions={{
                      color: '#3b82f6',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.1,
                      weight: 2,
                      dashArray: '5, 10'
                    }}
                  />
                </>
              )}
              <MarkerClusterGroup
                chunkedLoading
                spiderfyOnMaxZoom
                showCoverageOnHover={false}
                zoomToBoundsOnClick
                maxClusterRadius={40}
                disableClusteringAtZoom={15}
                iconCreateFunction={createClusterIcon}
              >
                {(mapFilter === 'all' || mapFilter === 'donations') && donations.filter(d => d.latitude && d.longitude).slice(0, 50).map(d => (
                  <Marker
                    key={d.id}
                    position={[d.latitude!, d.longitude!]}
                    icon={createMarkerIcon(statusColors[d.status] || '#6b7280', d.food_type)}
                  >
                    <Popup>
                      <strong>{d.title}</strong>
                      <br />
                      {d.food_type} - {d.quantity}
                      <br />
                      <div
                        onClick={() => navigate(`/donations/${d.id}`)}
                        style={{ color: '#22c55e', cursor: 'pointer', fontWeight: 600, marginTop: 6 }}
                      >
                        {t('donations.view_details')} →
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {(mapFilter === 'all' || mapFilter === 'requests') && requests.filter(r => r.latitude && r.longitude).map(r => (
                  <Marker
                    key={`req-${r.id}`}
                    position={[r.latitude!, r.longitude!]}
                    icon={createRequestMarkerIcon(r.status)}
                  >
                    <Popup>
                      <strong>{r.title}</strong>
                      <br />
                      {t('requests.member_count')}: {r.member_count}
                      <br />
                      <div
                        onClick={() => navigate(`/requests/${r.id}`)}
                        style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600, marginTop: 6 }}
                      >
                        {t('donations.view_details')} →
                      </div>
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
              <div className="hero-map-filter" style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: 1000,
                display: 'flex',
                gap: '6px',
                background: 'rgba(255,255,255,0.95)',
                padding: '6px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                {(['all', 'donations', 'requests'] as const).map(f => (
                  <button
                    key={f}
                    onClick={(e) => { e.stopPropagation(); setMapFilter(f); }}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: mapFilter === f ? '#22c55e' : 'transparent',
                      color: mapFilter === f ? '#fff' : '#374151',
                      cursor: 'pointer',
                      fontWeight: mapFilter === f ? 600 : 400,
                      fontSize: '13px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {f === 'all' ? t('common.all') : f === 'donations' ? t('nav.donations') : t('nav.requests')}
                  </button>
                ))}
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
              <div className={`stat-number ${statsChanged ? 'stat-pulse' : ''}`}>{formatNumber(stats?.totalUsers || 0)}</div>
            )}
            <div className="stat-label">{t('home.total_members')}</div>
          </div>
          <div className="stat-card">
            {loading ? (
              <div className="stat-number">...</div>
            ) : (
              <div className={`stat-number ${statsChanged ? 'stat-pulse' : ''}`}>{formatNumber(stats?.totalDonors || 0)}</div>
            )}
            <div className="stat-label">{t('home.total_donors')}</div>
          </div>
          <div className="stat-card">
            {loading ? (
              <div className="stat-number">...</div>
            ) : (
              <div className={`stat-number ${statsChanged ? 'stat-pulse' : ''}`}>{formatNumber(stats?.totalDonations || 0)}</div>
            )}
            <div className="stat-label">{t('home.total_active')}</div>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section className="cta-section">
        <div className="cta-card" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <div className="cta-content" style={{ textAlign: 'center' }}>
            <h2 className="cta-title" style={{ color: '#fff' }}>{t('nav.requests')}</h2>
            <p className="cta-desc" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Browse donation requests from people in need and help fulfill them
            </p>
            <Link to="/requests" className="btn btn-primary btn-lg">
              Browse Requests →
            </Link>
          </div>
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
              <Link to="/requests" className="btn btn-secondary btn-lg">
                {t('home.request_food')}
              </Link>
              <Link to="/donations" className="btn btn-outline btn-lg">
                {t('home.learn_more')}
              </Link>
              <Link to="/sadaqat" className="btn btn-gold btn-lg">
                {t('home.give_sadaqah')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
