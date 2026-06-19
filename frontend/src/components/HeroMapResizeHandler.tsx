import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function HeroMapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [map]);
  return null;
}
