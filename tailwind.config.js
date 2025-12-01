/** @type {import('tailwindcss').Config} */
const { addIconSelectors } = require("@iconify/tailwind");
module.exports = {
    content: ["**/*.{html,js}"],
    theme: {
        extend: {
            typography: {
                DEFAULT: {
                    css: {
                        code: {
                            '&::before': {
                                content: 'trans !important',
                            },
                            '&::after': {
                                content: 'none !important',
                            },
                        },
                    },
                },
            },
            // that is animation class
            animation: {
                fade: 'fadeOut 10s ease-in-out',
            },
            // that is actual animation
            keyframes: theme => ({
                fadeOut: {
                '0%': { backgroundColor: theme('colors.zinc.950')},
                '100%': { backgroundColor: theme('colors.transparent') },
                },
            }),
        },
    },
    plugins: [
        addIconSelectors(["game-icons"]),
    ],
}
