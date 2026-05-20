/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1a5c35',
          light: '#2d7a4a',
          dark: '#134429',
          50: '#f0f7f3',
          100: '#dcefe4',
          200: '#b9dfc9',
          300: '#8ec7a8',
          400: '#5daa80',
          500: '#3a8e62',
          600: '#2a7249',
          700: '#1a5c35',
          800: '#154a2a',
          900: '#113d24',
        },
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
    },
  },
  plugins: [],
}
