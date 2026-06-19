import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

export default function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    const prev = prevCenterRef.current;
    if (!prev || prev[0] !== center[0] || prev[1] !== center[1]) {
      prevCenterRef.current = center;
      map.flyTo(center, map.getZoom(), { duration: 1.5 });
    }
  }, [map, center]);
  return null;
}
