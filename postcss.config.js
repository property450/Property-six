// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // ✅ 新增这个
    tailwindcss: {},
    autoprefixer: {},
  },
}
