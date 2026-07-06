FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# VITE_GOOGLE_MAPS_API_KEY must be passed as a build arg so Vite bakes it
# into the static bundle at build time (VITE_* vars are compile-time only).
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint replaces the BACKEND_URL placeholder in nginx.conf with the
# real Cloud Run backend URL injected via the BACKEND_URL env variable.
# Falls back to http://backend:8000 for docker-compose local testing.
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
