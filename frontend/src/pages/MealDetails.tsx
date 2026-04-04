import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { fetchWithFailover } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import '../styles/MealDetails.css';

interface Donation {
  id: string;
  title: string;
  description: string;
  food_type: string;
  quantity: number;
  unit: string;
  pickup_address?: string;
  latitude: number;
  longitude: number;
  pickup_date: string;
  expiry_date: string;
  status: string;
  donor_id: string;
  donor_name: string;
  reserved_by?: string;
  hash_code?: string;
}

const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const pickupLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationTracker({ onLocation }: { onLocation: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    locationfound: (e) => {
      onLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  
  useEffect(() => {
    map.locate({ watch: true, enableHighAccuracy: true });
  }, [map]);
  
  return null;
}

function RouteInfo({ userLat, userLng, destLat, destLng }: { 
  userLat: number; 
  userLng: number; 
  destLat: number; 
  destLng: number;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!userLat || !destLat) return;
    
    const routingControl = (L as any).routing.control({
      waypoints: [
        L.latLng(userLat, userLng),
        L.latLng(destLat, destLng)
      ],
      routeWhileDragging: true,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: '#2D6A4F', weight: 5 }]
      }
    });
    
    routingControl.addTo(map);
    
    return () => {
      routingControl.remove();
    };
  }, [userLat, userLng, destLat, destLng, map]);
  
  return null;
}

export default function MealDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const res = await fetchWithFailover(`/api/donations/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          setError('Failed to load donation details');
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.donation) {
          setDonation(data.donation);
        } else {
          setError('Invalid donation data');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load donation details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchDonation();
    }
  }, [id, token]);

  const handleLocation = (lat: number, lng: number) => {
    setUserLat(lat);
    setUserLng(lng);
  };

  const handleMarkReceived = async () => {
    if (!token || !id) return;
    setActionLoading(true);
    try {
      await fetchWithFailover(`/api/donations/${id}/mark-received`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await fetchWithFailover(`/api/donations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.donation) {
        setDonation(data.donation);
      }
    } catch (err) {
      console.error('Failed to mark received:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!token || !id) return;
    setActionLoading(true);
    try {
      await fetchWithFailover(`/api/donations/${id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await fetchWithFailover(`/api/donations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.donation) {
        setDonation(data.donation);
      }
    } catch (err) {
      console.error('Failed to complete:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="meal-details-page">
        <div className="loading-container">
          <div className="loading-dots">...</div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="meal-details-page">
        <div className="error-container">
          <p>{error || 'Donation not found'}</p>
          <button onClick={() => navigate('/donations')} className="btn btn-primary">
            {t('common.back_to_donations')}
          </button>
        </div>
      </div>
    );
  }

  const pickupLat = donation.latitude;
  const pickupLng = donation.longitude;
  const hasValidLocation = pickupLat && pickupLng;

  return (
    <div className="meal-details-page">
      <div className="meal-details-header">
        <button onClick={() => navigate('/donations?filter=reserved')} className="btn btn-outline">
          ← {t('common.back')}
        </button>
        <h1>{donation.title}</h1>
        <span className={`status-badge status-${donation.status}`}>
          {t(`donations.${donation.status}`)}
        </span>
      </div>

      <div className="meal-details-content">
        <div className="meal-info-card">
          <div className="info-row">
            <span className="label">{t('donations.food_type')}:</span>
            <span className="value">{donation.food_type}</span>
          </div>
          <div className="info-row">
            <span className="label">{t('donations.quantity')}:</span>
            <span className="value">{donation.quantity} {donation.unit}</span>
          </div>
          {donation.description && (
            <div className="info-row">
              <span className="label">{t('donations.description')}:</span>
              <span className="value">{donation.description}</span>
            </div>
          )}
          <div className="info-row">
            <span className="label">{t('donations.pickup_address')}:</span>
            <span className="value">{donation.pickup_address || 'Address not available'}</span>
          </div>
          {donation.hash_code && (
            <div className="hash-section">
              <span className="label">{t('donations.hash_code')}:</span>
              <span className="hash-code">{donation.hash_code}</span>
              <p className="hash-hint">{t('donations.hash_hint')}</p>
            </div>
          )}
          
          {user?.id === donation.reserved_by && donation.status === 'reserved' && (
            <button 
              onClick={handleMarkReceived} 
              disabled={actionLoading}
              className="btn btn-success"
            >
              {actionLoading ? t('common.loading') : t('donations.mark_received')}
            </button>
          )}
          
          {(user?.id === donation.donor_id || user?.id === donation.reserved_by) && 
           (donation.status === 'reserved' || donation.status === 'received') && (
            <button 
              onClick={handleComplete} 
              disabled={actionLoading}
              className="btn btn-primary"
            >
              {actionLoading ? t('common.loading') : t('donations.complete')}
            </button>
          )}
        </div>

        <div className="map-section">
          <h3>{t('navigation.directions')}</h3>
          {hasValidLocation ? (
            <>
              <MapContainer
                center={[pickupLat, pickupLng]}
                zoom={14}
                style={{ height: '400px', width: '100%', borderRadius: '12px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {userLat && userLng && (
                  <>
                    <Marker position={[userLat, userLng]} icon={userLocationIcon}>
                      <Popup>{t('navigation.your_location')}</Popup>
                    </Marker>
                    <RouteInfo 
                      userLat={userLat} 
                      userLng={userLng} 
                      destLat={pickupLat} 
                      destLng={pickupLng} 
                    />
                  </>
                )}
                
                <Marker position={[pickupLat, pickupLng]} icon={pickupLocationIcon}>
                  <Popup>
                    <strong>{donation.title}</strong>
                    <br />
                    {donation.pickup_address}
                  </Popup>
                </Marker>
                
                <LocationTracker onLocation={handleLocation} />
              </MapContainer>
              
              <div className="navigation-info">
                <p className="info-text">
                  📍 <strong>{t('navigation.your_location')}</strong> → 🎯 <strong>{t('navigation.pickup_location')}</strong>
                </p>
                <p className="hint-text">
                  {t('navigation.use_map_directions')}
                </p>
              </div>
            </>
          ) : (
            <div className="no-map-message">
              <p>📍 {donation.pickup_address}</p>
              <p className="hint-text">{t('navigation.no_coordinates')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
