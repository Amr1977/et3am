import React, { useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string) => void;
  t: (key: string) => string;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ latitude, longitude, onLocationChange, t }: LocationPickerProps) {
  const hasLocation = latitude && longitude;
  const [position, setPosition] = useState<[number, number] | null>(
    hasLocation ? [parseFloat(latitude), parseFloat(longitude)] : null
  );
  const [locating, setLocating] = useState(false);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat.toFixed(6), lng.toFixed(6));
  }, [onLocationChange]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        onLocationChange(lat.toFixed(6), lng.toFixed(6));
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const center: [number, number] = position || [30.0444, 31.2357];

  return (
    <div className="location-picker">
      <div className="location-picker-header">
        <label className="location-picker-label">{t('donations.pickup_location')}</label>
        <button type="button" onClick={handleUseMyLocation} className="btn btn-outline btn-sm" disabled={locating}>
          📍 {locating ? t('common.loading') : t('donations.use_current_location')}
        </button>
      </div>
      <div className="location-picker-hint">
        {position
          ? `📍 ${position[0].toFixed(5)}, ${position[1].toFixed(5)}`
          : t('donations.click_map_to_set')
        }
      </div>
      <div className="location-picker-map">
        <MapContainer center={center} zoom={position ? 15 : 6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={`${import.meta.env.VITE_API_URL || ''}/api/maps/tiles/{z}/{x}/{y}.png`}
          />
          <MapClickHandler onLocationChange={handleMapClick} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>
    </div>
  );
}
