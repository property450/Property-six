import '@/styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { UserProvider } from '@supabase/auth-helpers-react'; // ✅ 加上这行
import { supabase } from '../supabaseClient'; // ✅ 确保也引入了 Supabase 客户端

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then(L => {
        delete L.Icon.Default.prototype._getIconUrl;

        L.Icon.Default.mergeOptions({
          iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
          iconUrl: require('leaflet/dist/images/marker-icon.png'),
          shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
        });
      });
    }
  }, []);

  return (
    <UserProvider supabaseClient={supabase}> {/* ✅ 包裹页面 */}
      <Header />
      <Component {...pageProps} />
    </UserProvider>
  );
}
