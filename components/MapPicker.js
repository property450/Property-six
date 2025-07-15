// components/MapPicker.js
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ClickMarker({ onPick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPick(lat, lng);
    },
  });
  return null;
}

export default function MapPicker({ lat, lng, onPick }) {
  const defaultCenter = lat && lng ? [lat, lng] : [3.139, 101.6869]; // KL 默认坐标

  return (
    <div className="my-4">
      <label className="block mb-2 font-semibold">地图定位（点击地图选择房源位置）</label>
      <MapContainer center={defaultCenter} zoom={12} style={{ height: '300px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickMarker onPick={onPick} />
        {lat && lng && <Marker position={[lat, lng]} />}
      </MapContainer>
      {lat && lng && (
        <p className="text-sm text-gray-600 mt-2">已选择坐标：Lat {lat.toFixed(5)}, Lng {lng.toFixed(5)}</p>
      )}
    </div>
  );
}
