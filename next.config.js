// next.config.js
const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // 默认已启用 swc 编译器
  },
  i18n, // ✅ 添加这一行，启用国际化
};

module.exports = nextConfig;
