'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Input } from '@/components/ui/input';
import FilterPanel from './FilterPanel';

const defaultCenter = [3.139, 101.6869]; // 吉隆坡

const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);

  return null;
}

export default function MapWithSearch({ properties = [] }) {
  const [filters, setFilters] = useState({
    keyword: '',
    maxPrice: 99999999,
    selectedType: '',
    selectedSubtype: '',
    radius: 5,
  });

  const [center, setCenter] = useState(null);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const provider = new OpenStreetMapProvider();
  const searchRef = useRef();

  useEffect(() => {
    if (!properties || properties.length === 0) return;

    const result = properties.filter((property) => {
      const { latitude, longitude, price, type, subtype } = property;

      if (filters.maxPrice && price > filters.maxPrice) return false;
      if (filters.selectedType && type !== filters.selectedType) return false;
      if (filters.selectedSubtype && subtype !== filters.selectedSubtype) return false;

      if (center && latitude && longitude) {
        const distance = getDistanceFromLatLonInKm(
          center[0],
          center[1],
          latitude,
          longitude
        );
        if (distance > filters.radius) return false;
      }

      return true;
    });

    setFilteredProperties(result);
  }, [properties, filters, center]);

  const handleAddressSearch = async () => {
    if (!filters.keyword) return;
    const results = await provider.search({ query: filters.keyword });
    if (results.length > 0) {
      const { x, y } = results[0];
      setCenter([y, x]);
    }
  };

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
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
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  return (
    <div className="flex flex-col md:flex-row h-[90vh] w-full">
      {/* 左侧筛选面板 */}
      <div className="w-full md:w-80 p-4 bg-white border-r space-y-4">
        <Input
          ref={searchRef}
          value={filters.keyword || ''}
          type="text"
          placeholder="请输入地址 / Enter address"
          onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
          onClick={handleAddressSearch}
        >
          搜索地址 / Search
        </button>

        <FilterPanel filters={filters} setFilters={setFilters} />
      </div>

      {/* 地图 */}
      <div className="flex-1 h-full relative">
        <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {center && <MapUpdater center={center} />}
          {center && (
            <Circle center={center} radius={filters.radius * 1000} pathOptions={{ color: 'blue' }} />
          )}
          {filteredProperties.map((property) => (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
              icon={customIcon}
            >
              <Popup>
                <div>
                  <strong>{property.title || '未命名房产'}</strong>
                  <p>价格: RM{property.price?.toLocaleString()}</p>
                  <p>类型: {property.type} / {property.subtype}</p>
                  <a href={`/property/${property.id}`} className="text-blue-500 underline">查看详情</a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
