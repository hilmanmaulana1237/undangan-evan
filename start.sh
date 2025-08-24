#!/bin/bash

echo ""
echo "================================================"
echo "   🎉 UNDANGAN DIGITAL KHITANAN AHMAD"
echo "================================================"
echo ""

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building JavaScript bundles..."
npx esbuild js/*.js --bundle --outdir=dist

echo ""
echo "🚀 Starting server..."
echo ""
echo "✅ Server akan berjalan di:"
echo "   - Main invitation: http://localhost:3000"
echo "   - Guest generator: http://localhost:3000/generate.html"
echo "   - Simple version:  http://localhost:3000/simple.html"
echo ""
echo "🛑 Tekan Ctrl+C untuk menghentikan server"
echo ""

node server.js
