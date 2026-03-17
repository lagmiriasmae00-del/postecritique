/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        navy: {
          50:  '#EEF4FF',
          100: '#D9E6FF',
          200: '#AECCFF',
          300: '#76AAFF',
          400: '#3D82F5',
          500: '#1E3A5F',
          600: '#162D4D',
          700: '#0F2040',
          800: '#091733',
          900: '#050E22',
        },
        orange: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA6C0A',
          700: '#C2570A',
          800: '#9A4409',
          900: '#7C3A09',
        },
        surface: '#EEF4FF',
        'text-primary': '#0F2040',
        'text-secondary': '#6B7280',
        success: '#22C55E',
        danger: '#EF4444',
        dark: {
          bg: '#0B0E14',
          card: '#151821',
          border: '#2A2E39',
        },
        accent: {
          blue: '#1B84FF',
          blueHover: '#146DE0',
          orange: '#F97316',
          orangeHover: '#EA6C0A',
        }
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
        'pill': '50px',
      },
      boxShadow: {
        'card': '0 4px 12px 0 rgba(30,58,95,0.06), 0 1px 3px 0 rgba(0,0,0,0.03)',
        'card-hover': '0 16px 32px -8px rgba(30,58,95,0.15), 0 8px 16px -8px rgba(0,0,0,0.05)',
        'nav': '0 1px 3px 0 rgba(0,0,0,0.05)',
        'modal': '0 24px 48px -12px rgba(30,58,95,0.25)',
        'button': '0 4px 14px 0 rgba(249,115,22,0.35)',
        'button-hover': '0 8px 24px 0 rgba(249,115,22,0.45)',
        'navy-glow': '0 0 40px -8px rgba(30,58,95,0.3)',
        'orange-glow': '0 0 30px -8px rgba(249,115,22,0.4)',
        'premium': '0 10px 40px -10px rgba(30, 58, 95, 0.1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'blob': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(10px, -20px) scale(1.1)' },
          '66%': { transform: 'translate(-10px, 10px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'fade-in-left': 'fade-in-left 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blob': 'blob 7s infinite',
      },
    },
  },
  plugins: [],
}
