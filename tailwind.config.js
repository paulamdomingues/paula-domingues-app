/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Extraído das variáveis/estilos do arquivo Figma "App V1 - User"
        'main-red': {
          50: '#F6E8E8',
          200: '#D49595',
          300: '#C16565',
          400: '#B54747',
          600: '#931717',
          700: '#731212',
          800: '#590E0E',
          900: '#440B0B',
        },
        'main-dark': {
          200: '#A88C8F',
          500: '#41060C',
          800: '#240307',
          900: '#1B0305',
        },
        error: {
          700: '#951C1C',
        },
        gray: {
          100: '#CCCBCB',
          200: '#B4B2B2',
          400: '#7D7979',
          500: '#5C5757',
          700: '#413E3E',
          800: '#333030',
          900: '#272525',
        },
        grey: {
          800: '#6F6F6F',
        },
        success: {
          800: '#135820',
        },
        base: {
          black: '#0D0101',
          white: '#FCF7F7',
        },
        accent: {
          yellow: '#FFCC00',
        },
        screen: {
          bg: '#F7F3F3',
        },
      },
      fontFamily: {
        display: ['"Sofia Sans Extra Condensed"', 'sans-serif'],
        body: ['"M PLUS 2"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
