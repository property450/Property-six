'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

export default function MapWithMarkersClient({ properties, addressLocation, distance }) {
  const [center, setCenter] = useState([3.139, 101.6869]); // Default: Kuala Lumpur
  const [zoom, setZoom] = useState(13);
  const [filteredMarkers, setFilteredMarkers] = useState([]);

  // 更新中心点
  useEffect(() => {
    if (addressLocation?.lat && addressLocation?.lng) {
      setCenter([addressLocation.lat, addressLocation.lng]);
    }
  }, [addressLocation]);

  // 计算距离
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
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

  // 根据距离筛选房源
  useEffect(() => {
    if (!addressLocation || !addressLocation.lat || !addressLocation.lng) {
      setFilteredMarkers(properties || []);
      return;
    }

    const filtered = properties.filter((property) => {
      if (!property.lat || !property.lng) return false;
      const d = getDistanceFromLatLonInKm(
        addressLocation.lat,
        addressLocation.lng,
        property.lat,
        property.lng
      );
      return d <= distance;
    });

    setFilteredMarkers(filtered);
  }, [properties, addressLocation, distance]);

  return (
    <div className="w-full h-[80vh] mt-4 rounded-2xl overflow-hidden">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 中心圆圈 */}
        {addressLocation?.lat && addressLocation?.lng && (
          <Circle
            center={[addressLocation.lat, addressLocation.lng]}
            radius={distance * 1000}
            pathOptions={{ color: 'blue', fillOpacity: 0.2 }}
          />
        )}

        {/* 房源 Marker */}
        {filteredMarkers.map((property) => (
          <Marker key={property.id} position={[property.lat, property.lng]}>
            <Popup>
              <div className="text-sm">
                <strong>{property.title || 'No title'}</strong>
                <br />
                {property.price ? `RM ${property.price.toLocaleString()}` : 'No price'}
                <br />
                {property.address || ''}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
