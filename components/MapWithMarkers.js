// components/MapWithMarkers.js
import dynamic from 'next/dynamic';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

// 动态导入 react-leaflet 和 leaflet，只在客户端运行
const MapWithMarkersClient = dynamic(() => import('./MapWithMarkersClient'), {
  ssr: false,
});

export default function MapWithMarkers(props) {
  return <MapWithMarkersClient {...props} />;
}
