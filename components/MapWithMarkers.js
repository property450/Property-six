// components/MapWithMarkers.js
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapWithMarkersClient = dynamic(() => import('./MapWithMarkersClient'), {
  ssr: false,
});

export default function MapWithMarkers(props) {
  return <MapWithMarkersClient {...props} />;
}
