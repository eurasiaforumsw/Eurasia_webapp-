#!/bin/bash
# Switch Git Remote to eurasia.webapp

echo "🔄 Switching git remote to eurasia.webapp..."
echo ""

# Show current remote
echo "Current remote:"
git remote -v
echo ""

# Remove old remote
git remote remove origin

# Add new remote (replace with your actual repo URL)
# Option A: If repo name is exactly "eurasia.webapp"
git remote add origin https://github.com/eurasiaforumsw/eurasia.webapp.git

# Option B: If repo name is "Eurasia_webapp" (without dash)
# git remote add origin https://github.com/eurasiaforumsw/Eurasia_webapp.git

echo "New remote:"
git remote -v
echo ""

echo "✅ Git remote updated!"
echo ""
echo "Next steps:"
echo "1. git push -u origin main"
echo "2. Connect this repo to Vercel"
echo "3. Deploy: vercel --prod"
