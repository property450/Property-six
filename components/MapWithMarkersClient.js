import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

const defaultPosition = [3.139, 101.6869]; // 吉隆坡坐标

export default function MapWithMarkersClient({ properties = [], center, radiusKm = 5 }) {
  const [filteredProperties, setFilteredProperties] = useState([]);

  useEffect(() => {
    if (!center) {
      setFilteredProperties(properties);
    } else {
      const withinRadius = properties.filter((p) => {
        if (!p.lat || !p.lng) return false;
        const distance = getDistanceFromLatLonInKm(center.lat, center.lng, p.lat, p.lng);
        return distance <= radiusKm;
      });
      setFilteredProperties(withinRadius);
    }
  }, [properties, center, radiusKm]);

  return (
    <MapContainer
      center={center ? [center.lat, center.lng] : defaultPosition}
      zoom={13}
      style={{ height: '600px', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.ti
