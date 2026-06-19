import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function MapHeroInteractionHandler({ onFirstInteraction }: { onFirstInteraction: () => void }) {
  const map = useMap();
  const hasTriggered = useRef(false);

  useEffect(() => {
    const handler = (e: L.LeafletEvent) => {
      if (!hasTriggered.current && (e as any).originalEvent) {
        hasTriggered.current = true;
        onFirstInteraction();
      }
    };

    map.on('dragstart', handler);
    map.on('zoomstart', handler);

    return () => {
      map.off('dragstart', handler);
      map.off('zoomstart', handler);
    };
  }, [map, onFirstInteraction]);

  return null;
}
