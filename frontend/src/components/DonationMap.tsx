import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface DonationMapProps {
  donations: Donation[];
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

export default function DonationMap({ donations, t }: DonationMapProps) {
  const geoDonations = donations.filter(d => d.latitude && d.longitude);
  const center: [number, number] = geoDonations.length > 0
    ? [geoDonations[0].latitude!, geoDonations[0].longitude!]
    : [30.0444, 31.2357];

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoDonations.map(d => (
          <Marker
            key={d.id}
            position={[d.latitude!, d.longitude!]}
            icon={createColoredIcon(statusColors[d.status] || '#6b7280')}
          >
            <Popup>
              <strong>{d.title}</strong>
              <br />
              {d.food_type} - {d.quantity}
              <br />
              <span style={{ color: statusColors[d.status], fontWeight: 600 }}>
                {t(`donations.${d.status}`)}
              </span>
              <br />
              📍 {d.pickup_address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
