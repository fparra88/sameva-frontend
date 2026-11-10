# Build estático de Vite + servido con nginx (fallback SPA).
# En EasyPanel: las variables VITE_* se pasan como "Build Args" (se incrustan al compilar).

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Variables del frontend (ver .env.example). Deben existir en build, no en runtime.
# URL pública de la API, sin /api al final. Ej. https://api.operativai.com.mx
ARG VITE_API_URL=""
# Conectar Facebook en Canales
ARG VITE_META_APP_ID=""
ARG VITE_META_CONFIG_ID=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_META_APP_ID=$VITE_META_APP_ID \
    VITE_META_CONFIG_ID=$VITE_META_CONFIG_ID

COPY . .
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;

  # Assets con hash: caché larga.
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }

  # SPA: cualquier ruta cae en index.html (sin caché para tomar nuevos despliegues).
  location / {
    add_header Cache-Control "no-cache";
    try_files $uri $uri/ /index.html;
  }
}
EOF
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
