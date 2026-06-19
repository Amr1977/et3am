import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

const mockFlyTo = vi.fn();
const mockSetView = vi.fn();
const mockGetZoom = vi.fn(() => 11);
const mockOn = vi.fn();
const mockOff = vi.fn();

vi.mock('react-leaflet', () => ({
  useMap: () => ({
    flyTo: mockFlyTo,
    setView: mockSetView,
    getZoom: mockGetZoom,
    on: mockOn,
    off: mockOff,
    invalidateSize: vi.fn(),
  }),
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  Circle: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MapCenterUpdater', () => {
  it('calls flyTo when center changes to a new value', async () => {
    const MapCenterUpdater = (await import('../MapCenterUpdater')).default;
    const { rerender } = render(<MapCenterUpdater center={[30.0, 31.0]} />);
    expect(mockFlyTo).toHaveBeenCalledTimes(1);
    expect(mockFlyTo).toHaveBeenCalledWith([30.0, 31.0], 11, { duration: 1.5 });

    rerender(<MapCenterUpdater center={[31.0, 32.0]} />);
    expect(mockFlyTo).toHaveBeenCalledTimes(2);
    expect(mockFlyTo).toHaveBeenLastCalledWith([31.0, 32.0], 11, { duration: 1.5 });
  });

  it('does NOT call flyTo when center is the same value', async () => {
    const MapCenterUpdater = (await import('../MapCenterUpdater')).default;
    const { rerender } = render(<MapCenterUpdater center={[30.0, 31.0]} />);
    expect(mockFlyTo).toHaveBeenCalledTimes(1);

    rerender(<MapCenterUpdater center={[30.0, 31.0]} />);
    expect(mockFlyTo).toHaveBeenCalledTimes(1);
  });
});

describe('MapFullscreenCenterHandler', () => {
  it('calls setView when entering fullscreen with a center', async () => {
    const MapFullscreenCenterHandler = (await import('../MapFullscreenCenterHandler')).default;
    const { rerender } = render(
      <MapFullscreenCenterHandler isFullscreen={false} center={[30.0, 31.0]} />
    );
    expect(mockSetView).not.toHaveBeenCalled();

    rerender(<MapFullscreenCenterHandler isFullscreen={true} center={[30.0, 31.0]} />);
    expect(mockSetView).toHaveBeenCalledTimes(1);
    expect(mockSetView).toHaveBeenCalledWith([30.0, 31.0], 11, { animate: true, duration: 0.5 });
  });

  it('does NOT call setView when entering fullscreen without a center', async () => {
    const MapFullscreenCenterHandler = (await import('../MapFullscreenCenterHandler')).default;
    const { rerender } = render(
      <MapFullscreenCenterHandler isFullscreen={false} center={null} />
    );
    expect(mockSetView).not.toHaveBeenCalled();

    rerender(<MapFullscreenCenterHandler isFullscreen={true} center={null} />);
    expect(mockSetView).not.toHaveBeenCalled();
  });

  it('calls setView again when re-entering fullscreen after exiting', async () => {
    const MapFullscreenCenterHandler = (await import('../MapFullscreenCenterHandler')).default;
    const { rerender } = render(
      <MapFullscreenCenterHandler isFullscreen={false} center={[30.0, 31.0]} />
    );
    expect(mockSetView).not.toHaveBeenCalled();

    rerender(<MapFullscreenCenterHandler isFullscreen={true} center={[30.0, 31.0]} />);
    expect(mockSetView).toHaveBeenCalledTimes(1);

    rerender(<MapFullscreenCenterHandler isFullscreen={false} center={[30.0, 31.0]} />);
    rerender(<MapFullscreenCenterHandler isFullscreen={true} center={[30.0, 31.0]} />);
    expect(mockSetView).toHaveBeenCalledTimes(2);
  });
});

describe('MapHeroInteractionHandler', () => {
  it('fires onFirstInteraction for events with originalEvent', async () => {
    const MapHeroInteractionHandler = (await import('../MapHeroInteractionHandler')).default;
    const onInteraction = vi.fn();

    render(<MapHeroInteractionHandler onFirstInteraction={onInteraction} />);

    expect(mockOn).toHaveBeenCalledWith('dragstart', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('zoomstart', expect.any(Function));

    const dragstartHandler = (
      mockOn.mock.calls as Array<[string, (e: object) => void]>
    ).find(([event]) => event === 'dragstart')?.[1];
    const zoomstartHandler = (
      mockOn.mock.calls as Array<[string, (e: object) => void]>
    ).find(([event]) => event === 'zoomstart')?.[1];

    expect(dragstartHandler).toBeDefined();
    expect(zoomstartHandler).toBeDefined();

    dragstartHandler!({ originalEvent: {} });
    expect(onInteraction).toHaveBeenCalledTimes(1);

    zoomstartHandler!({ originalEvent: {} });
    expect(onInteraction).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire for programmatic events without originalEvent', async () => {
    const MapHeroInteractionHandler = (await import('../MapHeroInteractionHandler')).default;
    const onInteraction = vi.fn();

    render(<MapHeroInteractionHandler onFirstInteraction={onInteraction} />);

    const dragstartHandler = (
      mockOn.mock.calls as Array<[string, (e: object) => void]>
    ).find(([event]) => event === 'dragstart')?.[1];
    const zoomstartHandler = (
      mockOn.mock.calls as Array<[string, (e: object) => void]>
    ).find(([event]) => event === 'zoomstart')?.[1];

    dragstartHandler!({});
    expect(onInteraction).not.toHaveBeenCalled();

    zoomstartHandler!({});
    expect(onInteraction).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', async () => {
    const MapHeroInteractionHandler = (await import('../MapHeroInteractionHandler')).default;
    const { unmount } = render(
      <MapHeroInteractionHandler onFirstInteraction={vi.fn()} />
    );

    unmount();

    expect(mockOff).toHaveBeenCalledWith('dragstart', expect.any(Function));
    expect(mockOff).toHaveBeenCalledWith('zoomstart', expect.any(Function));
  });
});
