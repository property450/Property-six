'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// 默认地图中心点（吉隆坡）
const defaultCenter = [3.139, 101.6869];
const defaultRadius = 5000;

export default function MapWithMarkersClient({ properties }) {
  const [center, setCenter] = useState(defaultCenter);
  const [radius, setRadius] = useState(defaultRadius);
  const [address, setAddress] = useState('');
  const [filteredProperties, setFilteredProperties] = useState(properties);

  const handleSearch = async () => {
    if (!address) return;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await res.json();

    if (data && data[0]) {
      const { lat, lon } = data[0];
      const newCenter = [parseFloat(lat), parseFloat(lon)];
      setCenter(newCenter);
    } else {
      alert('Address not found!');
    }
  };

  useEffect(() => {
    const filtered = properties.filter((p) => {
      if (!p.latitude || !p.longitude) return false;

      const distance = L.latLng(center).distanceTo([p.latitude, p.longitude]);
      return distance <= radius;
    });

    setFilteredProperties(filtered);
  }, [center, radius, properties]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address"
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '600px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle center={center} radius={radius} pathOptions={{ color: 'blue' }} />

        {filteredProperties.map((property) => (
          <Marker key={property.id} position={[property.latitude, property.longitude]}>
            <Popup>
              <div>
                <strong>{property.title}</strong>
                <br />
                {property.address}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
