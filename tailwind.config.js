/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '1.5rem',
        xl: '1rem',
        '2xl': '0px',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1180px',
        '2xl': '1180px',
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D6EFD',
          light: '#E3F0FF',
          dark: '#0056b3',
        },
        secondary: {
          DEFAULT: '#8B96A5', // Gray for text
          light: '#F7FAFC', // Background
        },
        dark: {
          DEFAULT: '#1C1C1C', // Heading
          light: '#505050', // Subtle text
        },
        orange: {
          DEFAULT: '#FF9017',
        },
        teal: {
          DEFAULT: '#00B517', // Success or specific accent
          light: '#E5F1E3',
        },
        aqua: {
          DEFAULT: '#237C02', // Some aqua/green in design
          light: '#C3FFCB',
        },
        shade: {
          DEFAULT: '#F7F7F7',
          border: '#E3E8EE'
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      spacing: {
        'container': '1180px',
      }
    },
  },
  plugins: [],
}
