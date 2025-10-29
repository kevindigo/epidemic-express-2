#!/bin/bash

# Deployment script for Epidemic Express PWA
# This script builds the app and prepares it for deployment

echo "🚀 Building Epidemic Express PWA for deployment..."

# Build the application
echo "📦 Running build process..."
deno task build

# Verify the build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Output directory: dist"
echo ""
echo "📋 Next steps:"
echo "   1. Commit and push the dist directory"
echo "   2. Configure GitHub Pages to serve from the dist folder"
echo "   3. Or use: git subtree push --prefix dist origin gh-pages"

# Optional: Create a simple deployment summary
echo "📊 Build Summary:"
echo "   - Service Worker: dist/service-worker.js"
echo "   - Main App: dist/main.js"
echo "   - Static Assets: dist/assets/"
echo "   - Cache Version: $(date +%s) (auto-generated)"