/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify 改成 compiler 配置（或直接删掉）
  compiler: {
    // 默认已经使用 swc 编译器
  }
};

module.exports = nextConfig;
