'use client';
import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import FilterPanel from './FilterPanel';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
L.Marker.prototype.options.icon = DefaultIcon;

const FlyToLocation = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14);
    }
  }, [center]);
  return null;
};

export default function MapWithSearch({ properties }) {
  const [filters, setFilters] = useState({
    keyword: '',
    minPrice: 0,
    maxPrice: 50000000,
    selectedType: '',
    selectedSubtype: '',
    radius: 5, // 单位：公里
  });

  const [filteredProperties, setFilteredProperties] = useState([]);
  const [center, setCenter] = useState([3.139, 101.6869]); // 默认吉隆坡中心点
  const provider = new OpenStreetMapProvider();
  const circleRef = useRef();

  useEffect(() => {
    // 搜索关键词时自动触发搜索
    if (filters.keyword) {
      provider.search({ query: filters.keyword }).then((results) => {
        if (results.length > 0) {
          const { x, y } = results[0]; // x=lng, y=lat
          const latlng = [y, x];
          setCenter(latlng);
        }
      });
    }
  }, [filters.keyword]);

  useEffect(() => {
    if (!center) return;

    const result = properties.filter((property) => {
      const { latitude, longitude, price, type, subtype } = property;

      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        typeof price !== 'number'
      )
        return false;

      const distance = getDistanceFromLatLonInKm(
        center[0],
        center[1],
        latitude,
        longitude
      );

      return (
        distance <= filters.radius &&
        price >= filters.minPrice &&
        price <= filters.maxPrice &&
        (filters.selectedType === '' || type === filters.selectedType) &&
        (filters.selectedSubtype === '' || subtype === filters.selectedSubtype)
      );
    });

    setFilteredProperties(result);
  }, [filters, center, properties]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
      {/* 筛选面板 */}
      <div className="col-span-1 space-y-4">
        <input
          type="text"
          placeholder="请输入地址 / Enter address"
          className="w-full p-2 border rounded"
          value={filters.keyword || ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, keyword: e.target.value }))
          }
        />

        <FilterPanel filters={filters} setFilters={setFilters} />
      </div>

      {/* 地图 */}
      <div className="col-span-1 md:col-span-3 h-[80vh]">
        <MapContainer center={center} zoom={13} style={{ height: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />

          <FlyToLocation center={center} />

          <Circle
            ref={circleRef}
            center={center}
            radius={filters.radius * 1000}
            pathOptions={{ color: 'blue', fillOpacity: 0.1 }}
          />

          {filteredProperties.map((property) => (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
            >
              <Popup>
                <div>
                  <strong>{property.title}</strong>
                  <br />
                  💰 RM{property.price.toLocaleString()}
                  <br />
                  🏠 {property.bedrooms} Rooms / 🛁 {property.bathrooms} Baths
                  <br />
                  🅿 {property.parking} Parking / 📦 {property.store} Store
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

// 计算两点之间的距离 (Haversine公式)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径 (公里)
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
