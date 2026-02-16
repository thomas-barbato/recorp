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
                dodge: 'dodge 0.35s ease-out'
            },
            // that is actual animation
            keyframes: theme => ({
                fadeOut: {
                    '0%': { backgroundColor: theme('colors.zinc.950')},
                    '100%': { backgroundColor: theme('colors.transparent') },
                },
                dodge: {
                    '0%':   { transform: 'scaleX(var(--flip)) translateY(0px)' },
                    '30%':  { transform: 'scaleX(var(--flip)) translateY(-10px)' },
                    '60%':  { transform: 'scaleX(var(--flip)) translateY(8px)' },
                    '100%': { transform: 'scaleX(var(--flip)) translateY(0px)' },
                },
            }),
        },
    },
    plugins: [
        addIconSelectors(["game-icons"]),
    ],
}
