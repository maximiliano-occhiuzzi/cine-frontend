# Build: compila el Angular con Node (imagen pesada, se descarta al final).
FROM node:20-alpine AS build
WORKDIR /app
# Igual que en los Dockerfile de los microservicios: copiar primero
# package*.json y bajar dependencias aparte del codigo para aprovechar el
# cache de capas de Docker si despues solo cambia el codigo fuente.
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime: nginx sirviendo los estáticos generados por el build.
# El build de Angular (builder "application", @angular-devkit/build-angular
# 17+) deja el resultado en dist/cine-frontend/browser -no en dist/cine-frontend
# a secas- es importante copiar de ahi o la imagen queda vacia/rota.
FROM nginx:alpine
COPY --from=build /app/dist/cine-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
