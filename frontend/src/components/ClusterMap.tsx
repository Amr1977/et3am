import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { getServerUrl } from '../services/api';
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

interface Donation {
  id: string;
  title: string;
  pickup_address: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  food_type: string;
  quantity: number;
  unit: string;
}

interface ClusterMapProps {
  donations: Donation[];
  userLocation?: { lat: number; lng: number } | null;
  t: (key: string) => string;
  onReserve?: (id: string) => void;
  isAuthenticated?: boolean;
  onBoundsChange?: (bounds: L.LatLngBounds | null) => void;
  newDonationIds?: string[];
  fullscreen?: boolean;
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

function createMarkerIcon(color: string, foodType: string, isNew: boolean = false) {
  const icon = getFoodIcon(foodType);
  const animationClass = isNew ? ' marker-bounce' : '';
  return L.divIcon({
    className: 'custom-marker-container' + animationClass,
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
        cursor: pointer;
      ">${icon}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

export default function ClusterMap({ donations, userLocation, t, onReserve, isAuthenticated, onBoundsChange, newDonationIds, fullscreen }: ClusterMapProps) {
  const [tileUrl, setTileUrl] = useState<string>('');
  const geoDonations = donations.filter(d => d.latitude && d.longitude);
  const newDonationIdsSet = new Set(newDonationIds || []);

  useEffect(() => {
    getServerUrl().then(url => {
      setTileUrl(`${url}/api/maps/tiles/{z}/{x}/{y}.png`);
    });
  }, []);

  function BoundsTracker() {
    const map = useMap();
    
    useEffect(() => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange(bounds);
        
        const moveEndHandler = () => {
          onBoundsChange(map.getBounds());
        };
        
        map.on('moveend', moveEndHandler);
        return () => {
          map.off('moveend', moveEndHandler);
        };
      }
    }, [map, onBoundsChange]);
    
    return null;
  }

  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : geoDonations.length > 0 
      ? [geoDonations[0].latitude!, geoDonations[0].longitude!]
      : [30.0444, 31.2357];

  const createClusterIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 'small';
    if (count > 10) size = 'medium';
    if (count > 50) size = 'large';
    
    return L.divIcon({
      html: `<div class="cluster-marker cluster-${size}"><span>${count}</span></div>`,
      className: 'marker-cluster-custom',
      iconSize: L.point(40, 40),
    });
  };

  const handlePopup = (id: string) => {
    if (onReserve) {
      onReserve(id);
    }
  };

  function MapController() {
    const map = useMap();
    
    useEffect(() => {
      if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 13);
      }
    }, [userLocation, map]);
    
    return null;
  }

  return (
    <div className="map-container">
      <MapContainer
        center={defaultCenter}
        zoom={userLocation ? 13 : 10}
        style={{ height: '100%', width: '100%' }}
      >
        <BoundsTracker />
        <MapController />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
        />
        {userLocation && (
          <>
            <Marker 
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={3500}
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
          maxClusterRadius={50}
          disableClusteringAtZoom={16}
          iconCreateFunction={createClusterIcon}
        >
          {geoDonations.map(d => {
            const color = statusColors[d.status] || '#6b7280';
            const foodIcon = getFoodIcon(d.food_type);
            const canReserve = d.status === 'available' && isAuthenticated;

            return (
              <Marker
                key={d.id}
                position={[d.latitude!, d.longitude!]}
                icon={createMarkerIcon(color, d.food_type, newDonationIdsSet.has(d.id))}
              >
                <Popup>
                  <div style={{ minWidth: '180px', padding: '8px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{foodIcon}</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{d.title}</div>
                    <div style={{ color: '#666', marginBottom: '8px' }}>{d.food_type} - {d.quantity} {d.unit}</div>
                    <div style={{ color, fontWeight: 600, marginBottom: '8px' }}>{t(`donations.${d.status}`)}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>📍 {d.pickup_address || 'No address'}</div>
                    {canReserve && (
                      <button
                        onClick={() => handlePopup(d.id)}
                        style={{
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          width: '100%',
                          fontWeight: 600,
                        }}
                      >
                        {t('donations.reserve')}
                      </button>
                    )}
                    <a
                      href={`/donations/${d.id}`}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        marginTop: '8px',
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontSize: '13px',
                      }}
                    >
                      {t('donations.view_card') || 'View Details'} →
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
