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
- ```npm install @tailwindcss/line-clamp```
- ```npx tailwindcss -i ./path/style.css -o ./dist/output.css --watch```
- ```npm i -D @iconify/tailwind```
- ```npm i -D @iconify-json/game-icons```
- ```npm install pixi.js ```

to install redis on docker : 

open docker terminal and type : 
- ```docker run -d --name redis -p 6379:6379 redis:latest```