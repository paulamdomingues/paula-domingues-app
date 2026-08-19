/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta oficial, extraída da página "CORES" (StyleGuide) do Figma
        // em 2026-08-18 — node 113:1382. Confere nomenclatura exata com a
        // Amanda antes de renomear/remover qualquer tom (alguns tons abaixo
        // ainda não tinham nome confirmado antes dessa conferência, ex:
        // main-red-100, main-red-500, e boa parte da rampa main-dark).
        'main-red': {
          50: '#F6E8E8',
          100: '#E2B8B8',
          200: '#D49595',
          300: '#C16565',
          400: '#B54747',
          500: '#A21919',
          600: '#931717',
          700: '#731212',
          800: '#590E0E',
          900: '#440B0B',
        },
        'main-dark': {
          50: '#ECE6E7',
          100: '#C4B2B4',
          200: '#A88C8F',
          300: '#80585C',
          400: '#67383D',
          500: '#41060C',
          600: '#3B050B',
          700: '#2E0409',
          800: '#240307',
          900: '#1B0305',
        },
        // Rampa "error" oficial, passada direto pela Amanda (o node do
        // Figma expõe essas cores como Variables, não como swatches no
        // canvas — por isso não apareceram na extração via get_design_context
        // da página CORES). É a mesma família do #D97706 já usado no botão
        // "Cancelar" do LogoutConfirmModal (aqui é o error-500).
        error: {
          50: '#FBF1E6',
          100: '#F3D5B2',
          200: '#EEC08C',
          300: '#E6A458',
          400: '#E19238',
          500: '#D97706',
          600: '#C56C05',
          700: '#9A5404',
          800: '#774103',
          900: '#5B3203',
        },
        gray: {
          50: '#EFEEEE',
          100: '#CCCBCB',
          200: '#B4B2B2',
          300: '#928E8E',
          400: '#7D7979',
          500: '#5C5757',
          600: '#544F4F',
          700: '#413E3E',
          800: '#333030',
          900: '#272525',
        },
        grey: {
          800: '#6F6F6F',
        },
        success: {
          50: '#E9F6EB',
          100: '#BAE2C2',
          200: '#99D3A5',
          300: '#6BBF7C',
          400: '#4EB362',
          800: '#135820',
          // 900 não veio do StyleGuide (só até o 800) — extrapolei escurecendo
          // o 800 na mesma proporção usada na rampa "error" (Amanda pediu
          // "success-200 preenchimento / success-900 texto" pro toast de
          // "adicionado aos favoritos", 19/08/2026). Ajusta se tiver o tom oficial.
          900: '#0D3D16',
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
