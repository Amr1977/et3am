import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

export default function MapFullscreenCenterHandler({ isFullscreen, center }: { isFullscreen: boolean; center: [number, number] | null }) {
  const map = useMap();
  const prevFullscreenRef = useRef(false);

  useEffect(() => {
    if (isFullscreen && !prevFullscreenRef.current) {
      if (center) {
        map.setView(center, map.getZoom(), { animate: true, duration: 0.5 });
      }
    }
    prevFullscreenRef.current = isFullscreen;
  }, [map, isFullscreen]);
  return null;
}
