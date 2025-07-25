'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../supabaseClient';
import PropertyCard from './PropertyCard';
import PriceRangeSelector from './PriceRangeSelector';
import TypeSelector from './TypeSelector';

// 解决默认 Marker 图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapWithMarkersClient({ center, radius }) {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [priceRange, setPriceRange] = useState([10000, 50000000]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data);
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    const filtered = properties.filter((p) => {
      const inPriceRange = p.price >= priceRange[0] && p.price <= priceRange[1];
      const inType = selectedTypes.length === 0 || selectedTypes.includes(p.type);
      let inCircle = true;
      if (center && p.lat && p.lng) {
        const distance = getDistanceFromLatLonInKm(center[0], center[1], p.lat, p.lng);
        inCircle = distance <= radius / 1000;
      }
      return inPriceRange && inType && inCircle;
    });
    setFilteredProperties(filtered);
  }, [properties, priceRange, selectedTypes, center, radius]);

  return (
    <div className="flex h-screen">
      {/* 左侧筛选器 */}
      <div className="w-80 p-4 bg-white shadow z-[1000] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">筛选条件</h2>
        <PriceRangeSelector value={priceRange} onChange={setPriceRange} />
        <TypeSelector selectedTypes={selectedTypes} onChange={setSelectedTypes} />
        <div className="mt-4">
          <p>当前房源数量：{filteredProperties.length}</p>
        </div>
      </div>

      {/* 地图区域 */}
      <div className="flex-1 relative z-0">
        {center ? (
          <MapContainer center={center} zoom={14} scrollWheelZoom style={{ height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle center={center} radius={radius} pathOptions={{ color: 'blue', fillOpacity: 0.1 }} />
            {filteredProperties.map((property) => (
              <Marker key={property.id} position={[property.lat, property.lng]}>
                <Popup>
                  <PropertyCard property={property} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="text-center mt-40 text-gray-600">请先搜索地址</div>
        )}
      </div>
    </div>
  );
}
