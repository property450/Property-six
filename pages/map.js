// pages/map.js
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 修复 marker 图标不显示的问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapPage() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error('Error fetching properties:', error);
    } else {
      setProperties(data);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">地图找房</h1>
      <MapContainer center={[3.139, 101.6869]} zoom={11} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {properties.map((property) => (
          property.lat && property.lng && (
            <Marker key={property.id} position={[property.lat, property.lng]}>
              <Popup>
                <div>
                  <strong>{property.title}</strong><br />
                  RM {property.price}<br />
                  <Link href={`/property/${property.id}`}>
                    <span className="text-blue-600 underline">查看详情</span>
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
