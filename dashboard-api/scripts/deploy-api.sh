#!/usr/bin/env bash
set -euo pipefail

# --- Config you set once (can be overridden via env when running) ---
: "${PROJECT_ID:=trogern-logistics}"
: "${REGION:=us-central1}"
: "${SERVICE_NAME:=api}"

# FRONTEND_ORIGIN must be the HTTPS origin that will call your API.
# For local-only deploys you can keep http://localhost:5173,
# but for Firebase Hosting use https://<your>.web.app (or your custom domain).
: "${FRONTEND_ORIGIN:=https://trogern-logistics.web.app}"

# Optional Cloud Run tuning
: "${MEMORY:=512Mi}"
: "${TIMEOUT:=20}"           # seconds
: "${CONCURRENCY:=80}"       # requests per instance
: "${MIN_INSTANCES:=0}"      # scale-to-zero by default

echo "🔧 Using config:"
echo "  PROJECT_ID:        $PROJECT_ID"
echo "  REGION:            $REGION"
echo "  SERVICE_NAME:      $SERVICE_NAME"
echo "  FRONTEND_ORIGIN:   $FRONTEND_ORIGIN"
echo "  MEMORY/TIMEOUT:    ${MEMORY}/${TIMEOUT}s"
echo "  CONCURRENCY:       ${CONCURRENCY}"
echo "  MIN_INSTANCES:     ${MIN_INSTANCES}"
echo

gcloud config set project "$PROJECT_ID" >/dev/null

# Enable required APIs (no-op if already enabled)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com >/dev/null

# Deploy from source (Cloud Buildpacks will run your package.json "gcp-build" then "start")
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory "$MEMORY" \
  --timeout "$TIMEOUT" \
  --concurrency "$CONCURRENCY" \
  --min-instances "$MIN_INSTANCES" \
  --set-env-vars "NODE_ENV=production,FRONTEND_ORIGIN=${FRONTEND_ORIGIN}"

# Output the URL so the web can consume it
API_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')"
echo
echo "✅ API deployed: $API_URL"
echo
echo "Next steps:"
echo "  • Set VITE_API_BASE_URL to: $API_URL"
echo "  • Rebuild & redeploy the frontend."
echo
echo "Quick checks:"
echo "  • Health:      curl -s $API_URL/healthz"
echo "  • CORS sanity: curl -sI -H 'Origin: $FRONTEND_ORIGIN' '$API_URL/api/v1/auth/me'"