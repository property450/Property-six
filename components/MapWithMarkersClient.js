import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/router';
import { supabase } from '@/supabaseClient';
import PropertyCard from './PropertyCard';

const defaultPosition = [3.139, 101.6869]; // Default: Kuala Lumpur

export default function MapWithMarkersClient({
  center,
  distance,
  typeFilter,
  priceRange,
}) {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const radius = distance * 1000;

  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error) setProperties(data);
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    if (!center || isNaN(center.lat) || isNaN(center.lng)) return;

    const filtered = properties.filter((p) => {
      const d = L.latLng(center.lat, center.lng).distanceTo([p.lat, p.lng]);
      return (
        (!typeFilter || p.type?.includes(typeFilter)) &&
        (!priceRange.min || p.price >= priceRange.min) &&
        (!priceRange.max || p.price <= priceRange.max) &&
        d <= radius
      );
    });
    setFilteredProperties(filtered);
  }, [properties, center, distance, typeFilter, priceRange]);

  return (
    <MapContainer
      center={[center?.lat || defaultPosition[0], center?.lng || defaultPosition[1]]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution='&copy; OpenStreetMap contributors'
      />

      {center && !isNaN(center.lat) && !isNaN(center.lng) && (
        <Circle center={[center.lat, center.lng]} radius={radius} />
      )}

      {filteredProperties.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          eventHandlers={{
            click: () => router.push(`/property/${p.id}`),
          }}
        >
          <Popup>
            <PropertyCard property={p} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
