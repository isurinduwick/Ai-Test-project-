import type { Config } from 'tailwindcss';
// San Francisco on Apple devices; Inter (next/font) as the closest look-alike elsewhere.
const sf = ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'var(--font-fallback)', '"Segoe UI"', 'Roboto', 'system-ui', 'sans-serif'];
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#06201d', 900: '#0a2b27', 800: '#11403a', 700: '#1b524a' },
        sea: { 50: '#f0f7f5', 100: '#dfeeea', 200: '#bcd9d2', 500: '#2f8f7f', 600: '#1f7a6b', 700: '#176054' },
        brass: { 400: '#dcb45e', 500: '#c19a45', 600: '#9a7731' },
      },
      fontFamily: { sans: sf, display: sf },
      boxShadow: {
        panel: '0 1px 2px rgba(6,32,29,.04), 0 14px 34px -18px rgba(6,32,29,.22)',
        lift: '0 24px 60px -24px rgba(6,32,29,.55)',
      },
    },
  },
  plugins: [],
};
export default config;
