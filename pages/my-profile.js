// pages/my-profile.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import PropertyCard from '@/components/PropertyCard';

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [myProperties, setMyProperties] = useState([]);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id);
      if (!error) setMyProperties(data);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🧍 我的房源</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {myProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
