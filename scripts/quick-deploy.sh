#!/bin/bash
echo "🚀 Quick Deploy - FitGenius"
npm run build
git add .
git commit -m "deploy: production update $(date)"
git push origin master
echo "✅ Pushed to GitHub - Vercel will auto-deploy"
