# FrontConcesionaria — multi-stage Dockerfile para producción.
#
# Build args:
#   VITE_API_BASE_URL — URL pública del backend (ej: https://api.tudominio.com/api)
#                        Vite la bakea al bundle, así que cada deploy con URL distinta
#                        requiere un nuevo build.
#   BACKEND_ORIGIN — origen del backend para CSP (sin path, ej: https://api.tudominio.com).
#                    Si no se provee, se deriva de VITE_API_BASE_URL.

# ──────────────────────── BUILDER ────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:3000/api

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Inyectar la URL del API al build de Vite.
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ──────────────────────── RUNTIME ────────────────────────
FROM nginx:alpine

# `gettext` provee `envsubst` para reemplazar placeholders en nginx.conf al arrancar.
RUN apk add --no-cache gettext curl

# Quitar el server block default.
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestra config como TEMPLATE — el entrypoint la procesará con envsubst.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copiar los assets construidos.
COPY --from=build /app/dist /usr/share/nginx/html

# Defaults — pueden sobrescribirse en runtime con env vars de Coolify.
ENV BACKEND_ORIGIN=http://localhost:3000

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fs http://localhost/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
