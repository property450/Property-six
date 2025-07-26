'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../supabaseClient';

const icon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapWithMarkersClient({ center, distance, priceRange, typeFilter }) {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      let { data, error } = await supabase.from('properties').select('*');

      if (!error && data) {
        const filtered = data.filter((property) => {
          const withinDistance =
            center &&
            property.latitude &&
            property.longitude &&
            getDistanceFromLatLonInKm(
              center.lat,
              center.lng,
              property.latitude,
              property.longitude
            ) <= distance;

          const withinPrice =
            property.price >= priceRange.min && property.price <= priceRange.max;

          const typeMatch =
            !typeFilter || property.type?.toLowerCase().includes(typeFilter.toLowerCase());

          return withinDistance && withinPrice && typeMatch;
        });

        setProperties(filtered);
      }
    };

    fetchData();
  }, [center, distance, priceRange, typeFilter]);

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  return (
    <MapContainer center={center} zoom={13} style={{ height: '80vh', width: '100%' }}>
      <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
      <Circle center={center} radius={distance * 1000} pathOptions={{ fillColor: 'blue' }} />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={icon}>
          <Popup>
            <div>
              <strong>{p.title}</strong>
              <br />
              RM {p.price}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
