import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // V3 navy palette replaces slate
        slate: {
          50:  '#F8FAFF',
          100: '#F0F4FF',
          200: '#DCE3F2',
          300: '#C0CCDF',
          400: '#A4AFCA',
          500: '#8392B5',
          600: '#253050',
          700: '#1A2440',
          750: '#162035',
          800: '#121A30',
          900: '#0B1020',
          950: '#080E1C',
        },
        // Coral palette replaces blue
        blue: {
          50:  '#FFF9E8',
          100: '#FFF0C0',
          200: '#FFE490',
          300: '#FFD166',
          400: '#FFD166',
          500: '#FFA043',
          600: '#FF5A4D',
          700: '#E03D32',
          800: '#B52E25',
          900: '#8B1E18',
          950: '#6B0F0A',
        },
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
