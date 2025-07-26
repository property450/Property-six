'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/router';
import { supabase } from '@/supabaseClient';
import PropertyCard from './PropertyCard';
import { Input } from '@/components/ui/input';
import PriceRangeSelector from '@/components/PriceRangeSelector';
import TypeSelector from '@/components/TypeSelector';
import DistanceSelector from '@/components/DistanceSelector';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

export default function MapWithMarkersClient({ center }) {
  const [properties, setProperties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000000);
  const [type, setType] = useState('');
  const [distance, setDistance] = useState(5); // km

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (!error && data) setProperties(data);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (!center || !center.lat || !center.lng || isNaN(center.lat) || isNaN(center.lng)) {
      setFiltered([]);
      return;
    }

    const filteredList = properties.filter((property) => {
      const lat = Number(property.lat);
      const lng = Number(property.lng);
      if (isNaN(lat) || isNaN(lng)) return false;

      const d = getDistance(center.lat, center.lng, lat, lng);
      return (
        property.price >= minPrice &&
        property.price <= maxPrice &&
        (!type || property.type?.includes(type)) &&
        d <= distance
      );
    });

    setFiltered(filteredList);
  }, [properties, minPrice, maxPrice, type, distance, center]);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-1 p-4 space-y-4">
        <PriceRangeSelector minPrice={minPrice} maxPrice={maxPrice} setMinPrice={setMinPrice} setMaxPrice={setMaxPrice} />
        <TypeSelector type={type} setType={setType} />
        <DistanceSelector distance={distance} setDistance={setDistance} />
      </div>

      <div className="md:col-span-3 h-[80vh] relative z-0">
        {center?.lat && center?.lng && !isNaN(center.lat) && !isNaN(center.lng) ? (
          <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom className="h-full z-0">
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle center={[center.lat, center.lng]} radius={distance * 1000} pathOptions={{ color: 'blue' }} />
            {filtered.map((property) => (
              <Marker
                key={property.id}
                position={[Number(property.lat), Number(property.lng)]}
                icon={customIcon}
              >
                <Popup minWidth={240}>
                  <PropertyCard property={property} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <p className="text-center text-gray-500 pt-10">🧭 地图中心点未定义</p>
        )}
      </div>
    </div>
  );
}
