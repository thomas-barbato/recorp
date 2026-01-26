# recorp
A web browser game project.

- Before anything, create a mysqluser :

CREATE DATABASE recorp_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER 'login'@'localhost'
IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON recorp_db.* TO 'login'@'localhost';
FLUSH PRIVILEGES;


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

- ```to run tailwind : npm run watch```

to install redis on docker : 

open docker terminal and type : 
- ```docker run -d --name redis -p 6379:6379 redis:latest```

to start celery on windows env:

celery -A recorp worker -l info --pool=solo