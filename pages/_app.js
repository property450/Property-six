// pages/_app.js
import '@/styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '../supabaseClient'; // 如果有用到 Supabase，可保留

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
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
