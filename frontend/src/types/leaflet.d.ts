declare module 'leaflet.markercluster' {
  import L from 'leaflet';
  
  interface MarkerClusterGroupOptions {
    chunkedLoading?: boolean;
    chunkInterval?: number;
    chunkDelay?: number;
    chunkingEnabled?: boolean;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    maxClusterRadius?: number;
    disableClusteringAtZoom?: number;
    animateAddingMarkers?: boolean;
    iconCreateFunction?: (cluster: MarkerCluster) => L.DivIcon;
    chunkedLoading?: boolean;
  }

  interface MarkerCluster extends L.Marker {
    getChildCount(): number;
    getAllChildMarkers(): L.Marker[];
    getBounds(): L.LatLngBounds;
  }

  class MarkerClusterGroup extends L.FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions);
    clearLayers(): this;
    addLayer(layer: L.Layer): this;
  }

  export { MarkerClusterGroup, MarkerClusterGroupOptions, MarkerCluster };
  export default MarkerClusterGroup;
}
