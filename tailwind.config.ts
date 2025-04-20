import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5D9BFF',
        secondary: '#FFD166',
        accent: '#06D6A0',
        neutral: {
          50: '#F8FAFC',
          900: '#1E293B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        dyslexic: ['OpenDyslexic', 'sans-serif']
      }
    },
  },
  plugins: [],
}
export default config
