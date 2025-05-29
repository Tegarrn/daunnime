// tegarrn/daunnime/daunnime-120152aa3dfc744e10c08e584c4c8188a076c281/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Tambahkan atau pastikan ini ada
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Anda bisa menambahkan kustomisasi tema di sini jika perlu
      // Misalnya, warna spesifik untuk mode gelap jika variabel CSS tidak cukup
      colors: {
        'dark-primary': '#1a202c', // Contoh
        'dark-secondary': '#2d3748', // Contoh
      },
      animation: {
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-out-left': 'slideOutLeft 0.5s ease-in forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-out': 'fadeOut 0.5s ease-in forwards',
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0.8' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutLeft: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0.8' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        }
      }
    },
  },
  plugins: [
    // require('@tailwindcss/forms'), // jika Anda menggunakan form
    // require('@tailwindcss/typography'), // jika Anda menggunakan class prose
  ],
};