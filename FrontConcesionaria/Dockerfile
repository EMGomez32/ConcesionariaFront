# FrontConcesionaria/Dockerfile
# ── Etapa de build ─────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# URL del backend horneada en el bundle (Vite la resuelve en build-time).
# Default: "/api" (relativa) => nginx proxya /api hacia el backend, mismo origen, sin CORS.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# .npmrc trae legacy-peer-deps=true (react-helmet-async vs React 19)
COPY package*.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

# ── Etapa de producción ────────────────────────────────────────
FROM nginx:alpine

# SPA fallback + proxy /api -> backend
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
