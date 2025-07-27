import '@/styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import Header from '@/components/Header';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 只在浏览器端执行
    if (typeof window !== 'undefined') {
      // 动态导入 Leaflet
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
