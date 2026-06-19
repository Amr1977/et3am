import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { getServerUrl, getInitialTileUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';

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
  onFullscreenChange?: (fullscreen: boolean) => void;
}

const statusColors: Record<string, string> = {
  available: '#22c55e',
  reserved: '#f59e0b',
  completed: '#3b82f6',
};

const foodIcons: Record<string, string> = {
  meat: '🥩',
  chicken: '🍗',
  fish: '🐟',
  vegetables: '🥬',
  fruits: '🍎',
  bread: '🍞',
  rice: '🍚',
  pasta: '🍝',
  soup: '🥣',
  dessert: '🍰',
  other: '🍽️',
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
    className: 'custom-marker-container leaflet-interactive' + animationClass,
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
        user-select: none;
        cursor: pointer;
        pointer-events: auto;
      ">${icon}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
  });
}

function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  const prevCenterRef = useRef(center);

  useEffect(() => {
    const [lat, lng] = center;
    const [prevLat, prevLng] = prevCenterRef.current;
    if (lat !== prevLat || lng !== prevLng) {
      prevCenterRef.current = center;
      map.flyTo(center, map.getZoom(), { duration: 1.5 });
    }
  }, [map, center]);
  return null;
}

function BoundsTracker({ onBoundsChange }: { onBoundsChange?: (bounds: L.LatLngBounds | null) => void }) {
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

export default function DonationsMap({ donations, userLocation, t, onReserve, isAuthenticated, newDonationIds, onBoundsChange, isFullscreen, onFullscreenChange }: DonationsMapProps) {
  const [tileUrl, setTileUrl] = useState<string>(getInitialTileUrl());
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const mapFullscreen = isFullscreen !== undefined ? isFullscreen : internalFullscreen;
  const navigate = useNavigate();
  const clusterGroupRef = useRef<L.MarkerClusterGroup>(null);

  const geoDonations = donations.filter(d => d.latitude && d.longitude);
  const newDonationIdsSet = new Set(newDonationIds || []);

  useEffect(() => {
    getServerUrl().then(url => {
      setTileUrl(`${url}/api/maps/tiles/{z}/{x}/{y}.png`);
    }).catch(() => {});
  }, []);

  const handleReserveClick = useCallback((id: string) => {
    if (onReserve) onReserve(id);
  }, [onReserve]);

  const handlePopupClick = useCallback((id: string) => {
    navigate(`/donations/${id}`);
  }, [navigate]);

  const handleClusterClick = useCallback((e: any) => {
    const cluster = e?.layer;
    if (!cluster) return;

    if (typeof cluster.getAllChildMarkers === 'function') {
      const markers = cluster.getAllChildMarkers();
      const map = cluster._map || (e.target && e.target._map);

      if (markers.length === 1) {
        markers[0].openPopup();
      } else if (markers.length > 1 && map) {
        map.fitBounds(cluster.getBounds(), { maxZoom: 16 });
      }
    } else if (typeof cluster.openPopup === 'function') {
      cluster.openPopup();
    }
  }, []);

  const handleMarkerClick = useCallback((e: any) => {
    const layer = e?.layer;
    if (!layer) return;
    if (typeof layer.getChildCount === 'function') return;
    if (typeof layer.openPopup === 'function') {
      layer.openPopup();
    }
  }, []);

  useEffect(() => {
    const group = clusterGroupRef.current;
    if (!group) return;
    group.on('click', handleMarkerClick);
    return () => { group.off('click', handleMarkerClick); };
  }, [handleMarkerClick]);

  const handleInteraction = useCallback(() => {
    if (onFullscreenChange) onFullscreenChange(true);
    else setInternalFullscreen(true);
  }, [onFullscreenChange]);

  const center = useMemo(() =>
    userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : null,
    [userLocation?.lat, userLocation?.lng]
  );

  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : geoDonations.length > 0
      ? [geoDonations[0].latitude!, geoDonations[0].longitude!]
      : [30.0444, 31.2357];

  return (
    <div className={`donations-map ${mapFullscreen ? 'fullscreen' : ''}`}>
      <MapContainer
        center={defaultCenter}
        zoom={userLocation ? 13 : 11}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        zoomControl={false}
        attributionControl={false}
      >
        <BoundsTracker onBoundsChange={onBoundsChange} />
        {center && <MapCenterUpdater center={center} />}
        {!mapFullscreen && <MapInteractionHandler onInteraction={handleInteraction} />}
        <TileLayer url={tileUrl} />

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
          ref={clusterGroupRef}
          chunkedLoading
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          zoomToBoundsOnClick={false}
          maxClusterRadius={40}
          disableClusteringAtZoom={15}
          iconCreateFunction={createClusterIcon}
          onClick={handleClusterClick}
        >
          {geoDonations.slice(0, 50).map(d => {
            const color = statusColors[d.status] || '#6b7280';
            const canReserve = d.status === 'available' && isAuthenticated;

            return (
              <Marker
                key={d.id}
                position={[d.latitude!, d.longitude!]}
                icon={createMarkerIcon(color, d.food_type, newDonationIdsSet.has(d.id))}
              >
                <Popup>
                  <div style={{ minWidth: '180px', padding: '8px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{getFoodIcon(d.food_type)}</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{d.title}</div>
                    <div style={{ color: '#666', marginBottom: '8px' }}>{d.food_type} - {d.quantity} {d.unit}</div>
                    <div style={{ color, fontWeight: 600, marginBottom: '8px' }}>{t(`donations.${d.status}`)}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>📍 {d.pickup_address || 'No address'}</div>
                    {canReserve && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReserveClick(d.id); }}
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
                    <div
                      onClick={() => handlePopupClick(d.id)}
                      style={{
                        textAlign: 'center',
                        marginTop: '8px',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        padding: '6px',
                        borderRadius: '4px',
                        background: '#f0f7ff',
                      }}
                    >
                      {t('donations.view_details')} →
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
      {mapFullscreen && (
        <button
          className="map-fullscreen-close"
          onClick={(e) => { e.stopPropagation(); if (onFullscreenChange) onFullscreenChange(false); else setInternalFullscreen(false); }}
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
        onClick={() => { const next = !mapFullscreen; if (onFullscreenChange) onFullscreenChange(next); else setInternalFullscreen(next); }}
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
    </div>
  );
}
