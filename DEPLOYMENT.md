# Deployment Guide — LaunchWise AI

**Cloud Run is the primary deployment target.** Docker Compose, Kubernetes,
and Helm assets in this repo exist so the project can move to a cluster
later without rewriting anything — none of them are required to ship the
hackathon demo.

## Cloud Run (primary)

```bash
# Backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/launchwise-backend backend/
gcloud run deploy launchwise-backend \
  --image gcr.io/$PROJECT_ID/launchwise-backend \
  --platform managed --region us-central1 --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=<key>,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,FIRESTORE_DATABASE=launchwise-db,STORAGE_BUCKET=<bucket>

# Frontend
cd frontend && npm run build
firebase init hosting && firebase deploy
```

## Local multi-container testing (Docker Compose)

Useful for testing the built container images before a Cloud Run deploy —
not needed for day-to-day development (`npm run dev` + `uvicorn --reload`
is faster for that).

```bash
docker compose up --build
# frontend: http://localhost:8080
# backend:  http://localhost:8000
```

## Kubernetes / GKE (optional, future)

Plain manifests for a first GKE deployment:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

Replace `gcr.io/PROJECT_ID/...` in `k8s/deployment.yaml` with your actual
project ID and pushed image tags first. Secrets (`GEMINI_API_KEY`, etc.) are
expected as a Secret named `launchwise-secrets` — create it with:

```bash
kubectl create secret generic launchwise-secrets \
  --from-literal=GEMINI_API_KEY=<key> \
  --from-literal=GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --from-literal=FIRESTORE_DATABASE=launchwise-db \
  --from-literal=STORAGE_BUCKET=<bucket> \
  --from-literal=GOOGLE_MAPS_API_KEY=<key>
```

## Helm (optional, future)

Equivalent to the raw manifests above, parameterized via `helm/launchwise/values.yaml`:

```bash
helm install launchwise ./helm/launchwise \
  --set projectId=$PROJECT_ID \
  --set backend.image.repository=gcr.io/$PROJECT_ID/launchwise-backend \
  --set frontend.image.repository=gcr.io/$PROJECT_ID/launchwise-frontend \
  --set secrets.GEMINI_API_KEY=<key> \
  --set secrets.GOOGLE_CLOUD_PROJECT=$PROJECT_ID
```

## Analytics stack (BigQuery + Looker)

Not part of request-path deployment — see `backend/services/README.md` for
the BigQuery service, and `backend/docs/LOOKER_SETUP.md` for connecting
Looker Studio/Looker to the resulting dataset.
