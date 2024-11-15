module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
  theme:{
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0'},
          '100%': { opacity: '1'}
        }
      }
    }
  }
}
