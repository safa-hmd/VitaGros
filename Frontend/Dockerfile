# ---------- Étape 1 : build Angular ----------
FROM node:20-alpine AS build
WORKDIR /app

# Cache des dépendances npm (ne se refait que si package*.json change)
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Étape 2 : runtime (nginx) ----------
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
# Angular 18 (builder "application") génère dans dist/<nom>/browser
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
