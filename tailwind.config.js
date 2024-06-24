/** @type {import('tailwindcss').Config} */
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
            }
        },
    },
    plugins: [],
}