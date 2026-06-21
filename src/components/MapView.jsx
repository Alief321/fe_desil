import { MapContainer, TileLayer, CircleMarker, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

const MapView = ({ mapData, getMarkerColor, onMarkerClick }) => {
  const getClusterIcon = (cluster) => {
    const childMarkers = cluster.getAllChildMarkers();
    const colorCounts = {};

    childMarkers.forEach((marker) => {
      const color = marker?.options?.pathOptions?.fillColor || marker?.options?.color || '#2563eb';
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });

    const dominantColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '#2563eb';

    return L.divIcon({
      html: `
        <div style="
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), rgba(255,255,255,0.1)), ${dominantColor};
          border: 3px solid rgba(255,255,255,0.95);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 13px;
        ">${cluster.getChildCount()}</div>
      `,
      className: 'custom-cluster-icon',
      iconSize: [44, 44],
    });
  };

  return (
    <div className="h-full w-full z-10">
      <MapContainer center={[-8.6833, 116.1167]} zoom={11} className="h-full w-full" zoomControl={false}>
        <ZoomControl position="bottomright" />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerClusterGroup chunkedLoading={true} iconCreateFunction={getClusterIcon}>
          {mapData
            .filter((d) => d.lokasi?.includes(','))
            .map((d, i) => {
              const pos = d.lokasi.split(',').map(parseFloat);
              const markerColor = getMarkerColor(d.desil);
              return (
                <CircleMarker
                  key={i}
                  center={pos}
                  radius={8}
                  pathOptions={{
                    fillColor: markerColor,
                    color: '#fff',
                    weight: 2,
                    fillOpacity: 0.9,
                  }}
                  eventHandlers={{
                    click: () => onMarkerClick?.(d),
                  }}
                />
              );
            })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default MapView;
