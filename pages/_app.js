// pages/_app.js
import '@/styles/globals.css';
import 'leaflet/dist/leaflet.css'; // ✅ 引入 Leaflet 样式
import { appWithTranslation } from 'next-i18next'; // ✅ 多语言支持
import { useEffect } from 'react';
import Header from '@/components/Header'; // 如果你有通用导航栏

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 解决 Leaflet 图标不显示的问题（可选增强）
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Component {...pageProps} />
      </main>
      <Footer />
    </div>
  );
}

export default appWithTranslation(MyApp);
