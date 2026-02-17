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
                dodge: 'dodge 0.35s ease-out',
                'float-damage': 'float-damage 1.2s ease-out forwards'
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
                'float-damage': {
                    '0%':   { opacity: '0', transform: 'translate(-50%, 10px) scale(0.6)' },
                    '15%':  { opacity: '1', transform: 'translate(-50%, 0px) scale(1.2)' },
                    '60%':  { opacity: '1', transform: 'translate(-50%, -25px) scale(1)' },
                    '100%': { opacity: '0', transform: 'translate(-50%, -55px) scale(0.9)' }
                }
            }),
        },
    },
    plugins: [
        addIconSelectors(["game-icons"]),
    ],
}
