import React, { useEffect, useRef } from 'react';
import { useMap, MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

import 'leaflet/dist/leaflet.css';
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
}

interface ClusterMapProps {
  donations: Donation[];
  userLocation?: { lat: number; lng: number } | null;
  t: (key: string) => string;
}

const statusColors: Record<string, string> = {
  available: '#22c55e',
  reserved: '#f59e0b',
  completed: '#3b82f6',
};

function createColoredIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function MapEvents({ userLocation, donations, t }: { 
  userLocation?: { lat: number; lng: number } | null; 
  donations: Donation[];
  t: (key: string) => string;
}) {
  const map = useMap();
  const clusterRef = useRef<any>(null);
  const initialized = useRef(false);
  
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
    if (initialized.current) return;
    initialized.current = true;
    
    const MarkerClusterGroup = (L as any).markerClusterGroup;
    if (!MarkerClusterGroup) return;
    
    clusterRef.current = MarkerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      disableClusteringAtZoom: 15,
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
    });
    
    donations.forEach(d => {
      if (!d.latitude || !d.longitude) return;
      const color = statusColors[d.status] || '#6b7280';
      const marker = L.marker([d.latitude, d.longitude], {
        icon: createColoredIcon(color),
      });
      
      marker.bindPopup(`
        <strong>${d.title}</strong><br/>
        ${d.food_type} - ${d.quantity}<br/>
        <span style="color: ${color}; font-weight: 600;">${t(`donations.${d.status}`)}</span><br/>
        📍 ${d.pickup_address || 'N/A'}
      `);
      
      clusterRef.current.addLayer(marker);
    });
    
    map.addLayer(clusterRef.current);
    
    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map, donations, t]);
  
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

export default function ClusterMap({ donations, userLocation, t }: ClusterMapProps) {
  const geoDonations = donations.filter(d => d.latitude && d.longitude);
  
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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents userLocation={userLocation} donations={geoDonations} t={t} />
      </MapContainer>
    </div>
  );
}
