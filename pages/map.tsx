// pages/map.tsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from '../supabaseClient';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Image from 'next/image';

// 修复默认图标不显示的问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 类型定义
type Property = {
  id: string;
  title: string;
  price: number;
  lat: number;
  lng: number;
  images?: string[];
};

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, {
      duration: 1.5,
    });
  }, [lat, lng, map]);
  return null;
}

export default function MapPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const isChinese = typeof window !== 'undefined' && navigator.language.startsWith('zh');

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    setLoading(true);
    const { data, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error('Error fetching properties:', error);
    } else {
      setProperties(data);
    }
    setLoading(false);
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">
        {isChinese ? '地图找房' : 'Find Properties on Map'}
      </h1>

      {loading ? (
        <div className="text-center py-20">{isChinese ? '加载中...' : 'Loading...'}</div>
      ) : (
        <MapContainer
          center={[3.139, 101.6869]}
          zoom={11}
          style={{ height: '600px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {properties.map((property) => {
            if (!property.lat || !property.lng) return null;

            const coverImage =
              property.images && property.images.length > 0
                ? property.images[0]
                : 'https://via.placeholder.com/300x200?text=No+Image';

            return (
              <Marker
                key={property.id}
                position={[property.lat, property.lng]}
                eventHandlers={{
                  click: () => setSelected({ lat: property.lat, lng: property.lng }),
                }}
              >
                <Popup minWidth={250}>
                  <div className="space-y-1">
                    <Image
                      src={coverImage}
                      alt={property.title}
                      width={300}
                      height={200}
                      className="rounded object-cover"
                      loading="lazy"
                    />
                    <div className="mt-2">
                      <strong>{property.title}</strong><br />
                      <span className="text-green-700 font-semibold">RM {property.price}</span><br />
                      <Link href={`/property/${property.id}`} className="text-blue-600 underline">
                        {isChinese ? '查看详情' : 'View Details'}
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {selected && <FlyToLocation lat={selected.lat} lng={selected.lng} />}
        </MapContainer>
      )}
    </div>
  );
}
