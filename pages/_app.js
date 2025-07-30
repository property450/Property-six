// pages/_app.js
import '@/styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import Header from '@/components/Header';

export default function MyApp({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

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
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <Header />
      <Component {...pageProps} />
    </SessionContextProvider>
  );
}
