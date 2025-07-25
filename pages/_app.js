// pages/_app.js
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import 'leaflet/dist/leaflet.css';
import '@/styles/globals.css'; // 你自己的样式文件

function MyApp({ Component, pageProps }) {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <div>
        <Header />
        <Component {...pageProps} />
      </div>
    </SessionContextProvider>
  );
}

export default MyApp;
