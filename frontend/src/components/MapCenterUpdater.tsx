import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

export default function MapCenterUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  const prevRef = useRef<{ center: [number, number]; zoom?: number } | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    const centerChanged = !prev || prev.center[0] !== center[0] || prev.center[1] !== center[1];
    if (centerChanged || (zoom !== undefined && prev?.zoom !== zoom)) {
      prevRef.current = { center, zoom };
      map.flyTo(center, zoom ?? map.getZoom(), { duration: 1.5 });
    }
  }, [map, center, zoom]);
  return null;
}
