#!/bin/sh
# Replaces the BACKEND_URL placeholder in nginx.conf with the real backend
# URL at container startup. This allows the same image to work both on
# Cloud Run (where the backend URL is a Cloud Run service URL) and in
# docker-compose (where it's http://backend:8000).
BACKEND_URL="${BACKEND_URL:-http://backend:8000}"
sed -i "s|BACKEND_URL|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
