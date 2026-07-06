# LaunchWise AI — Backend (FastAPI) container image.
# Built for Cloud Run (the primary deployment target); also usable as-is
# with docker-compose.yml and the k8s/ manifests for local/cluster testing.

FROM python:3.12-slim

WORKDIR /app

# System deps for matplotlib (chart rendering in pdf_service.py) — headless, no GUI libs needed.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfreetype6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run injects $PORT; default to 8000 for docker-compose/local/K8s use.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
