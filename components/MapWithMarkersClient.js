'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import Image from 'next/image';

export default function MapWithMarkersClient({ properties = [], centerLat, centerLng, radiusKm = 5 }) {
  const [filteredProperties, setFilteredProperties] = useState([]);

  const isValidLat = typeof centerLat === 'number' && !isNaN(centerLat);
  const isValidLng = typeof centerLng === 'number' && !isNaN(centerLng);

  const center = {
    lat: isValidLat ? centerLat : 3.139,
    lng: isValidLng ? centerLng : 101.6869
  };

  const radius = radiusKm * 1000;

  useEffect(() => {
    const filtered = properties.filter((p) => {
      if (!p.latitude || !p.longitude) return false;
      const distance = L.latLng(center.lat, center.lng).distanceTo([p.latitude, p.longitude]);
      return distance <= radius;
    });

    setFilteredProperties(filtered);
  }, [center, radius, properties]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Circle center={[center.lat, center.lng]} radius={radius} pathOptions={{ color: 'blue', fillOpacity: 0.1 }} />

      {filteredProperties.map((property) => {
        const image = property.images?.[0]?.url || '/no-image.jpg';
        return (
          <Marker key={property.id} position={[property.latitude, property.longitude]}>
            <Popup>
              <div className="text-sm space-y-2">
                <Image src={image} alt={property.title} width={200} height={120} className="rounded-md object-cover" />
                <div className="font-semibold">{property.title}</div>
                <div className="text-red-600 font-bold">RM {property.price}</div>
                <div className="text-gray-500">{property.address}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
