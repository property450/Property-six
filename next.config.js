// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-supabase-bucket-url.supabase.co'], // 替换成你实际图片域名
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      // 解决 leaflet 的 SSR 问题
      'leaflet': 'leaflet/dist/leaflet.js',
    };
    return config;
  },
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
  },
};

module.exports = nextConfig;
