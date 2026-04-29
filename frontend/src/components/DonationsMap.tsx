import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { getServerUrl } from '../services/api';

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

interface DonationsMapProps {
  donations: Donation[];
  userLocation?: { lat: number; lng: number } | null;
  t: (key: string) => string;
  onReserve?: (id: string) => void;
  isAuthenticated?: boolean;
  newDonationIds?: string[];
  onBoundsChange?: (bounds: L.LatLngBounds | null) => void;
  isFullscreen?: boolean;
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
    html: `<div style="
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
      ">${icon}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

export default function DonationsMap({ donations, userLocation, t, onReserve, isAuthenticated, newDonationIds, onBoundsChange, isFullscreen }: DonationsMapProps) {
  const [tileUrl, setTileUrl] = useState<string>('');
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const mapFullscreen = isFullscreen !== undefined ? isFullscreen : internalFullscreen;
  const debugLogsRef = useRef<string[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);
  const geoDonations = donations.filter(d => d.latitude && d.longitude);
  const newDonationIdsSet = new Set(newDonationIds || []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    const log = `[${time}] ${msg}`;
    console.log(log);
    debugLogsRef.current = [...debugLogsRef.current.slice(-20), log];
    forceUpdate(n => n + 1);
  };

  const clearLogs = () => {
    debugLogsRef.current = [];
    forceUpdate(n => n + 1);
  };

  const logs = debugLogsRef.current;

  // Prevent map clicks when interacting with the debug log
  useEffect(() => {
    const logContainer = document.querySelector('.debug-log-container');
    if (logContainer) {
      L.DomEvent.disableClickPropagation(logContainer as HTMLElement);
      L.DomEvent.disableScrollPropagation(logContainer as HTMLElement);
    }
  }, [logs]);

  // Prevent map clicks from bubbling to parent components
  useEffect(() => {
    if (mapContainerRef.current) {
      L.DomEvent.disableClickPropagation(mapContainerRef.current);
      L.DomEvent.disableScrollPropagation(mapContainerRef.current);
    }
  }, []);

  useEffect(() => {
    addLog('DonationsMap component mounted');
    getServerUrl().then(url => {
      addLog(`Server URL fetched, setting tile URL`);
      setTileUrl(`${url}/api/maps/tiles/{z}/{x}/{y}.png`);
    }).catch(err => {
      addLog(`Error fetching server URL: ${err.message}`);
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

  function MapEventsLogger() {
    useMapEvents({
      click: (e) => {
        const target = e.originalEvent.target as HTMLElement;
        const classes = target.className || 'no-class';
        addLog(`MAP click at [${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}], target class: ${classes}`);
      },
      mousedown: (e) => {
        const target = e.originalEvent.target as HTMLElement;
        const classes = target.className || 'no-class';
        addLog(`MAP mousedown at [${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}], target class: ${classes}`);
      },
      popupopen: (e) => {
        addLog(`MAP popupopen event from ${e.popup?.getContent() ? 'content' : 'unknown'}`);
      },
      popupclose: (e) => {
        addLog(`MAP popupclose event`);
      }
    });
    return null;
  }

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

  const handleReserveClick = (id: string) => {
    if (onReserve) {
      onReserve(id);
    }
  };

  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : geoDonations.length > 0 
      ? [geoDonations[0].latitude!, geoDonations[0].longitude!]
      : [30.0444, 31.2357];

  return (
    <div 
      className={`donations-map ${mapFullscreen ? 'fullscreen' : ''}`}
      ref={mapContainerRef}
    >
      <MapContainer
        center={defaultCenter}
        zoom={userLocation ? 13 : 11}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        zoomControl={false}
        attributionControl={false}
        closePopupOnClick={false}
      >
        <BoundsTracker />
        <MapEventsLogger />
        <TileLayer
          url={tileUrl || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />

        {userLocation && (
          <>
            <Marker 
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            />
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
          maxClusterRadius={40}
          disableClusteringAtZoom={15}
          iconCreateFunction={createClusterIcon}
        >
          {geoDonations.slice(0, 50).map(d => {
            const color = statusColors[d.status] || '#6b7280';
            const canReserve = d.status === 'available' && isAuthenticated;
            
            return (
              <Marker
                key={d.id}
                position={[d.latitude!, d.longitude!]}
                icon={createMarkerIcon(color, d.food_type, newDonationIdsSet.has(d.id))}
                eventHandlers={{
                  click: (e: L.LeafletMouseEvent) => {
                    addLog(`Marker CLICK: ${d.id} (${d.title})`);
                    e.target.openPopup();
                  },
                }}
              >
                <Popup closeButton={true}>
                  <div style={{ minWidth: '180px', padding: '8px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{getFoodIcon(d.food_type)}</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{d.title}</div>
                    <div style={{ color: '#666', marginBottom: '8px' }}>{d.food_type} - {d.quantity} {d.unit}</div>
                    <div style={{ color, fontWeight: 600, marginBottom: '8px' }}>{t(`donations.${d.status}`)}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>📍 {d.pickup_address || 'No address'}</div>
                    {canReserve && (
                      <button
                        onClick={() => handleReserveClick(d.id)}
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
      </button>
    </div>
  );
          })}
        </MarkerClusterGroup>
      </MapContainer>
      {mapFullscreen && (
        <button 
          className="map-fullscreen-close"
          onClick={(e) => { e.stopPropagation(); setInternalFullscreen(false); }}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          ✕
        </button>
      )}
      <button 
        onClick={() => { setInternalFullscreen(!internalFullscreen); }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        {mapFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      <DebugLog logs={logs} onClear={clearLogs} />
    </div>
  );
}