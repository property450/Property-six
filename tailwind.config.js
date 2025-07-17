/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",     // 扫描所有页面文件
    "./components/**/*.{js,ts,jsx,tsx}" // 扫描所有组件文件
  ],
  darkMode: 'media', // 也可以改成 'class'（你如果以后想手动切换深浅模式）
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)'
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif']
      }
    }
  },
  plugins: []
}
