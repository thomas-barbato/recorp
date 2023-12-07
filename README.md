# recorp
A web browser game project.

to install tailwind:

- Install nodejs
- Install tailwindcss : ``npm install -D tailwindcss``
- inside tailwind.config.js ```/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
}```

- Add ```@tailwind base;
@tailwind components;
@tailwind utilities;``` on the top of .css files.

- ```npx tailwindcss -i ./path/style.css -o ./dist/output.css --watch```
