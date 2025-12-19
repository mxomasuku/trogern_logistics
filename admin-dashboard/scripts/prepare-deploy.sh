#!/bin/bash
# scripts/prepare-deploy.sh
# Prepares admin-dashboard for standalone deployment by bundling the domain package

set -e

echo "📦 Building @trogern/domain..."
cd ../packages/domain
npm run build

echo "📋 Copying domain package to admin-dashboard/lib/domain..."
cd ../../admin-dashboard

# Create the destination directory
mkdir -p ./lib/domain

# Copy the built package
cp -r ../packages/domain/dist ./lib/domain/
cp ../packages/domain/package.json ./lib/domain/

echo "✅ Domain package bundled to lib/domain!"
echo ""
echo "You can now deploy with: vercel --prod"
