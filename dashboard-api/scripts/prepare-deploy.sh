#!/usr/bin/env bash
# Pre-deployment script: Bundles the @trogern/domain package for Cloud Run deployment
set -euo pipefail

echo "🔧 Preparing dashboard-api for deployment..."

# 1. Build the domain package
echo "📦 Building @trogern/domain package..."
cd ../packages/domain
npm run build
cd ../../dashboard-api

# 2. Copy domain package into lib/domain (not node_modules!)
echo "📋 Copying domain package to lib/domain..."
rm -rf lib/domain
mkdir -p lib/domain

# Copy the built package
cp -r ../packages/domain/dist lib/domain/
cp ../packages/domain/package.json lib/domain/

# 3. Build dashboard-api
echo "🏗️  Building dashboard-api..."
npm run build

echo "✅ Pre-deployment preparation complete!"
echo ""
echo "The domain package has been bundled into lib/domain"

echo ""
