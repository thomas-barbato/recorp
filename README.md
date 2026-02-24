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

## Celery (Windows / dev)

Prerequisites:
- Redis running locally on `127.0.0.1:6379`
- Python venv activated

Useful commands:

- Start worker (Windows safe mode):
```powershell
celery -A recorp worker -l info -P solo
```

- Start scheduler (Beat) for periodic gameplay tasks (`wreck_expired`, NPC respawn, future timers):
```powershell
celery -A recorp beat -l info
```

- Purge queued tasks (useful after task name/config changes):
```powershell
celery -A recorp purge
```

- Optional quick test from Django shell:
```python
from core.tasks import game_world_tick
game_world_tick.delay()
```

Notes:
- `worker` executes tasks.
- `beat` schedules periodic tasks.
- In dev, both must be running if you want non-lazy timed gameplay events.
