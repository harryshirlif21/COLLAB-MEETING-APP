/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0f1117',
          secondary: '#1a1d26',
          tertiary: '#23262f',
        },
        surface: {
          DEFAULT: '#1a1d26',
          hover: '#23262f',
        },
        primary: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          light: '#818cf8',
        },
        secondary: {
          DEFAULT: '#22c55e',
          hover: '#16a34a',
        },
        accent: {
          DEFAULT: '#38bdf8',
          hover: '#0ea5e9',
        },
        text: {
          primary: '#e5e7eb',
          secondary: '#9ca3af',
          muted: '#6b7280',
        },
        danger: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
        },
        border: '#30363d',
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(79, 70, 229, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
