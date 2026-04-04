import React, { useEffect, useRef, useState } from 'react';
import { useMap, MapContainer, TileLayer } from 'react-leaflet';
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

function MapEvents({ userLocation, donations, t, onReserve, isAuthenticated }: { 
  userLocation?: { lat: number; lng: number } | null; 
  donations: Donation[];
  t: (key: string) => string;
  onReserve?: (id: string) => void;
  isAuthenticated?: boolean;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | L.LayerGroup | null>(null);
  
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    } else if (donations.length > 0) {
      const validDonations = donations.filter(d => d.latitude && d.longitude);
      if (validDonations.length > 0) {
        const bounds = L.latLngBounds(validDonations.map(d => [d.latitude!, d.longitude!]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [userLocation, donations, map]);
  
  useEffect(() => {
    console.log('[ClusterMap] useEffect:', { map: !!map, donations: donations.length, hasCluster: !!clusterGroupRef.current });
    if (!map) {
      console.log('[ClusterMap] No map!');
      return;
    }
    
    let clusterGroup = clusterGroupRef.current;
    
    if (!clusterGroup) {
      clusterGroup = (L as any).markerClusterGroup ? (L as any).markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
        disableClusteringAtZoom: 16,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count > 10) size = 'medium';
          if (count > 50) size = 'large';
          
          return L.divIcon({
            html: `<div class="cluster-marker cluster-${size}"><span>${count}</span></div>`,
            className: 'marker-cluster-custom',
            iconSize: L.point(40, 40),
          });
        },
      }) : L.layerGroup();
      
      clusterGroupRef.current = clusterGroup as any;
      map.addLayer(clusterGroup as any);
    }
    
    const clusterGroupAny = clusterGroupRef.current as any;
    clusterGroupAny.clearLayers();
    
    donations.forEach(d => {
      console.log('Processing donation:', d.id, d.latitude, d.longitude, d.title);
      if (!d.latitude || !d.longitude) return;
      
      const color = statusColors[d.status] || '#6b7280';
      const marker = L.marker([d.latitude, d.longitude], {
        icon: createMarkerIcon(color, d.food_type),
      });
      
      const foodIcon = getFoodIcon(d.food_type);
      const canReserve = d.status === 'available' && isAuthenticated;
      
      const popupContent = `
        <div style="min-width: 180px; padding: 8px;">
          <div style="font-size: 24px; margin-bottom: 8px;">${foodIcon}</div>
          <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">${d.title}</div>
          <div style="color: #666; margin-bottom: 8px;">${d.food_type} - ${d.quantity} ${d.unit}</div>
          <div style="color: ${color}; font-weight: 600; margin-bottom: 8px;">${t(`donations.${d.status}`)}</div>
          <div style="font-size: 12px; color: #888; margin-bottom: 8px;">📍 ${d.pickup_address || 'No address'}</div>
          ${canReserve ? `
            <button 
              onclick="window.reserveDonation('${d.id}')"
              style="
                background: #22c55e;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                width: 100%;
                font-weight: 600;
              "
            >${t('donations.reserve')}</button>
          ` : ''}
          <a 
            href="/donations#${d.id}" 
            style="
              display: block;
              text-align: center;
              margin-top: 8px;
              color: #3b82f6;
              text-decoration: none;
              font-size: 13px;
            "
          >${t('donations.view_card') || 'View Details'} →</a>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        maxWidth: 250,
        className: 'donation-popup'
      });
      
      clusterGroupRef.current!.addLayer(marker);
    });
    
    window.reserveDonation = (id: string) => {
      if (onReserve) {
        onReserve(id);
      }
    };
    
    return () => {
      window.reserveDonation = () => {};
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, donations, t, onReserve, isAuthenticated]);
  
  useEffect(() => {
    if (!userLocation || !map) return;
    
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: '<div class="user-location-marker"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    
    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
    userMarker.bindPopup(t('donations.your_location') || 'Your Location');
    userMarker.addTo(map);
    
    return () => {
      userMarker.remove();
    };
  }, [userLocation, map, t]);
  
  return null;
}

declare global {
  interface Window {
    reserveDonation?: (id: string) => void;
  }
}

export default function ClusterMap({ donations, userLocation, t, onReserve, isAuthenticated }: ClusterMapProps) {
  console.log('[ClusterMap] Render:', { donations: donations.length, hasGeo: donations.filter(d => d.latitude && d.longitude).length });
  const [tileUrl, setTileUrl] = useState<string>('');
  const geoDonations = donations.filter(d => d.latitude && d.longitude);

  useEffect(() => {
    getServerUrl().then(url => {
      setTileUrl(`${url}/api/maps/tiles/{z}/{x}/{y}.png`);
    });
  }, []);
  console.log('ClusterMap: geoDonations:', geoDonations.length, 'total:', donations.length);
  
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : geoDonations.length > 0 
      ? [geoDonations[0].latitude!, geoDonations[0].longitude!]
      : [30.0444, 31.2357];

  return (
    <div className="map-container">
      <MapContainer
        center={defaultCenter}
        zoom={userLocation ? 13 : 10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
        />
        <MapEvents 
          userLocation={userLocation} 
          donations={geoDonations} 
          t={t}
          onReserve={onReserve}
          isAuthenticated={isAuthenticated}
        />
      </MapContainer>
    </div>
  );
}