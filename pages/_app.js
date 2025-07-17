// pages/_app.js
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import '../styles/globals.css';

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
