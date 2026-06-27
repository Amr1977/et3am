import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { getServerUrl, getInitialTileUrl } from '../services/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Request {
  id: string;
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  member_count: number;
  meals_fulfilled: number;
}

interface RequestsMapProps {
  requests: Request[];
  t: (key: string, params?: any) => string;
  onViewDetails?: (id: string) => void;
  onFulfill?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
}

function createRequestIcon(status: string): L.DivIcon {
  const colors: Record<string, string> = {
    open: '#22c55e',
    partially_fulfilled: '#f59e0b',
    fulfilled: '#3b82f6',
  };
  const bg = colors[status] || '#6b7280';
  return L.divIcon({
    html: `<div style="
      width: 36px; height: 36px;
      background: ${bg};
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">📦</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function createClusterIcon(cluster: any): L.DivIcon {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div style="
      width: ${count < 10 ? '44px' : '52px'}; 
      height: ${count < 10 ? '44px' : '52px'};
      background: #6366f1;
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${count}</div>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });
}

function MapInteractionHandler({ onInteraction }: { onInteraction: () => void }) {
  const map = useMap();
  const hasTriggered = useRef(false);

  useEffect(() => {
    const handleInteraction = () => {
      if (!hasTriggered.current) {
        hasTriggered.current = true;
        onInteraction();
      }
    };

    map.on('dragstart', handleInteraction);
    map.on('zoomstart', handleInteraction);

    return () => {
      map.off('dragstart', handleInteraction);
      map.off('zoomstart', handleInteraction);
    };
  }, [map, onInteraction]);

  return null;
}

function MapResizeHandler({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map, active]);
  return null;
}

function MapContent({ requests, t, onViewDetails, onFulfill, center, zoom }: RequestsMapProps) {
  const map = useMap();

  useEffect(() => {
    if (center && map) {
      map.flyTo(center, zoom || 10, { duration: 1 });
    }
  }, [center, map, zoom]);

  const markers = requests.filter(r => r.latitude && r.longitude);

  if (markers.length === 0) return null;

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={60}
      iconCreateFunction={createClusterIcon}
    >
      {markers.map(r => (
        <Marker
          key={r.id}
          position={[r.latitude!, r.longitude!]}
          icon={createRequestIcon(r.status)}
        >
          <Popup>
            <div style={{ minWidth: '180px' }}>
              <strong>{r.title}</strong>
              <p style={{ margin: '4px 0', fontSize: '0.9em' }}>
                🙏 {r.meals_fulfilled}/{r.member_count} {t('requests.progress', { fulfilled: r.meals_fulfilled, total: r.member_count })}
              </p>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(r.id)}
                    style={{
                      padding: '4px 10px',
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85em',
                    }}
                  >
                    {t('donations.view_details')}
                  </button>
                )}
                {r.status !== 'fulfilled' && r.status !== 'cancelled' && onFulfill && (
                  <button
                    onClick={() => onFulfill(r.id)}
                    style={{
                      padding: '4px 10px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85em',
                    }}
                  >
                    {t('requests.fulfill')}
                  </button>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
}

export default function RequestsMap(props: RequestsMapProps) {
  const [tileUrl, setTileUrl] = useState<string>(getInitialTileUrl());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    getServerUrl().then(url => {
      setTileUrl(`${url}/api/maps/tiles/{z}/{x}/{y}.png`);
    });
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const defaultCenter: [number, number] = [30.0444, 31.2357];
  const center = props.center || defaultCenter;
  const zoom = props.zoom || 6;

  return (
    <div
      className={`requests-map${isFullscreen ? ' fullscreen' : ''}`}
      style={isFullscreen ? {
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        width: '100vw',
        height: '100vh',
        background: '#fff',
        overflow: 'hidden',
      } : { height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}
    >
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
        />
        {!isFullscreen && <MapInteractionHandler onInteraction={() => setIsFullscreen(true)} />}
        <MapResizeHandler active={isFullscreen} />
        <MapContent {...props} />
      </MapContainer>
      {isFullscreen && (
        <button
          className="map-fullscreen-close"
          onClick={() => setIsFullscreen(false)}
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
    </div>
  );
}
