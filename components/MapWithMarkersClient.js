'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import Image from 'next/image';

export default function MapWithMarkersClient({ properties = [], centerLat, centerLng, radiusKm = 5 }) {
  const [mapCenter, setMapCenter] = useState({ lat: 3.139, lng: 101.6869 });
  const [filteredProperties, setFilteredProperties] = useState([]);

  useEffect(() => {
    if (typeof centerLat === 'number' && typeof centerLng === 'number' && !isNaN(centerLat) && !isNaN(centerLng)) {
      setMapCenter({ lat: centerLat, lng: centerLng });
    }
  }, [centerLat, centerLng]);

  useEffect(() => {
    const radius = radiusKm * 1000;
    const filtered = properties.filter((p) => {
      if (!p.latitude || !p.longitude) return false;
      const distance = L.latLng(mapCenter.lat, mapCenter.lng).distanceTo([p.latitude, p.longitude]);
      return distance <= radius;
    });
    setFilteredProperties(filtered);
  }, [properties, mapCenter, radiusKm]);

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Circle center={[mapCenter.lat, mapCenter.lng]} radius={radiusKm * 1000} pathOptions={{ color: 'blue', fillOpacity: 0.1 }} />

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
