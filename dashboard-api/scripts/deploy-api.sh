#!/usr/bin/env bash
set -euo pipefail

# --- config you set once ---
: "${PROJECT_ID:=trogern-logistics}"
: "${REGION:=us-central1}"
: "${SERVICE_NAME:=api}"
# Frontend origin used by your CORS + cookie SameSite logic
: "${FRONTEND_ORIGIN="http://localhost:5173"}"

gcloud config set project "$PROJECT_ID" >/dev/null

# Enable required APIs (no-op if already enabled)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com >/dev/null

# Deploy from source (Cloud Buildpacks will run "gcp-build" then "start")
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,FRONTEND_ORIGIN=${FRONTEND_ORIGIN}"

# Output the URL so web can consume it
API_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')"
echo "✅ API deployed: $API_URL"