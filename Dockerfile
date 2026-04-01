# Usamos una versión de Node mucho más ligera (Alpine o Slim)
FROM node:18-slim

# Instalamos Chromium de forma manual (ocupa mucho menos espacio que el Puppeteer full)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Le decimos al bot que use el Chromium que acabamos de instalar
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Solo copiamos lo necesario para instalar dependencias
COPY package*.json ./
RUN npm install --production

# Copiamos el resto del código
COPY . .

# Comando de arranque
CMD ["node", "axtelix_connect.js"]