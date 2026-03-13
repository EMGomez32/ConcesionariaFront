# FrontConcesionaria/Dockerfile
# Etapa de construcción
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar los archivos construidos de Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de nginx para manejar SPA (opcional pero recomendado)
# RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
