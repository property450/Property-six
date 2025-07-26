// components/MapWithMarkersClient.js
'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import DistanceSelector from './DistanceSelector';
import PriceRangeSelector from './PriceRangeSelector';
import TypeSelector from './TypeSelector';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MapWithMarkersClient({
  properties = [],
  location = null,
  priceRange,
  setPriceRange,
  selectedType,
  setSelectedType,
  distance,
  setDistance,
}) {
  const [filteredProperties, setFilteredProperties] = useState([]);

  useEffect(() => {
    if (!location) return;

    const filtered = properties.filter((property) => {
      const distanceToProperty = getDistanceFromLatLng(
        location.lat,
        location.lng,
        property.lat,
        property.lng
      );

      const withinDistance = distanceToProperty <= distance;
      const withinPrice = (!priceRange.min || property.price >= priceRange.min) &&
                          (!priceRange.max || property.price <= priceRange.max);
      const matchesType = !selectedType || property.type === selectedType;

      return withinDistance && withinPrice && matchesType;
    });

    setFilteredProperties(filtered);
  }, [properties, location, priceRange, selectedType, distance]);

  function getDistanceFromLatLng(lat1, lng1, lat2, lng2) {
    if ([lat1, lng1, lat2, lng2].some((v) => v === null || isNaN(v))) return Infinity;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  if (!location || !location.lat || !location.lng) {
    return <div>📍 请输入地址以显示地图</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/4 p-2 space-y-4">
        <PriceRangeSelector priceRange={priceRange} setPriceRange={setPriceRange} />
        <TypeSelector selectedType={selectedType} setSelectedType={setSelectedType} />
        <DistanceSelector distance={distance} setDistance={setDistance} />
      </div>

      <div className="w-full md:w-3/4 h-[600px]">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full z-0 rounded-xl"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
          />

          <Circle
            center={[location.lat, location.lng]}
            radius={distance * 1000}
            pathOptions={{ color: 'blue', fillOpacity: 0.1 }}
          />

          {filteredProperties.map((property) => (
            <Marker
              key={property.id}
              position={[property.lat, property.lng]}
              icon={customIcon}
            >
              <Popup>
                <strong>{property.title}</strong><br />
                💰 RM{property.price}<br />
                🏷️ {property.type}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
