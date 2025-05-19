/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["**/*.{html,js}"],
    theme: {
        extend: {
            lineClamp: {
                7: '7',
                8: '8',
                9: '9',
                10: '10',
                11: '11',
                12: '12',
                13: '13',
                14: '14',
                15: '15',
                16: '16',
                17: '17',
                18: '18',
                19: '19',
                20: '20',
            },
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
        require("@tailwindcss/line-clamp"),
    ],
}
