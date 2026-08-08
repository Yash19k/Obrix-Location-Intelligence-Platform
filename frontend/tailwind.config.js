/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Obrix Light Geospatial Palette
        obrix: {
          bg: '#F6F8FC',
          white: '#FFFFFF',
          text: '#08111F',
          secondary: '#5D6675',
          muted: '#8A94A3',
          border: '#DDE3EC',
          blue: '#315CF5',
          'blue-hover': '#2448D8',
          'soft-blue': '#E9EFFF',
          green: '#43B96B',
          'soft-green': '#E7F7E9',
          dark: '#08111F',
        },
        // Existing brand palette — preserved for app compatibility
        brand: {
          50:  '#e9efff',
          100: '#dbe5ff',
          200: '#bfd2ff',
          300: '#94b3ff',
          400: '#5e88ff',
          500: '#315cf5',  // Primary brand blue
          600: '#2448d8',  // Blue hover
          700: '#1b34b3',
          800: '#1a2b8e',
          900: '#192772',
          950: '#0f1747',
        },
        accent: {
          400: '#43b96b',  // Success green
          500: '#34a75b',
          600: '#268a47',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          850: '#172032',
          900: '#f6f8fc',  // Updated to Obrix Light page bg
          950: '#080f1e',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #315cf5 0%, #2448d8 100%)',
        'gradient-surface': 'linear-gradient(180deg, #f6f8fc 0%, #ffffff 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(49,92,245,0.05) 0%, rgba(67,185,107,0.03) 100%)',
      },
      boxShadow: {
        '2xs': '0 1px 2px rgba(8, 17, 31, 0.04)',
        'xs': '0 2px 4px rgba(8, 17, 31, 0.05)',
        'glow': '0 0 20px rgba(49, 92, 245, 0.25)',
        'glow-lg': '0 0 40px rgba(49, 92, 245, 0.35)',
        'card': '0 4px 24px rgba(8, 17, 31, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(49, 92, 245, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(49, 92, 245, 0.4)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
