#!/bin/bash
# Find and deploy the vclop-backend application on Hostinger

echo "=========================================="
echo "🔍 Finding VCLOP Backend Deployment"
echo "=========================================="
echo ""

# Show current directory
echo "📍 Current directory:"
pwd
echo ""

# Check common deployment locations
echo "🔍 Checking common locations..."
echo ""

if [ -d "~/domains" ]; then
  echo "✅ Found ~/domains:"
  ls -la ~/domains/
  echo ""
fi

if [ -d "~/public_html" ]; then
  echo "✅ Found ~/public_html:"
  ls -la ~/public_html/
  echo ""
fi

if [ -d "~/repositories" ]; then
  echo "✅ Found ~/repositories:"
  ls -la ~/repositories/
  echo ""
fi

# Search for vclop-backend
echo "🔍 Searching for vclop-backend..."
find ~ -maxdepth 4 -name "vclop-backend" -type d 2>/dev/null
echo ""

# Search for package.json with vclop
echo "🔍 Searching for vclop package.json..."
find ~ -maxdepth 5 -name "package.json" -exec grep -l "vclop" {} \; 2>/dev/null
echo ""

# Check for Node.js processes
echo "🔍 Checking for Node.js processes..."
ps aux | grep node | grep -v grep
echo ""

# Check for PM2
echo "🔍 Checking PM2 status..."
if command -v pm2 &> /dev/null; then
  pm2 list
else
  echo "❌ PM2 not found in PATH"
  echo "Checking alternative locations..."
  if [ -f "~/.nvm/versions/node/*/bin/pm2" ]; then
    ~/.nvm/versions/node/*/bin/pm2 list
  elif [ -f "/usr/local/bin/pm2" ]; then
    /usr/local/bin/pm2 list
  else
    echo "PM2 not installed or not accessible"
  fi
fi
echo ""

# Check Node version
echo "📦 Node.js version:"
if command -v node &> /dev/null; then
  node --version
else
  echo "Node not found in PATH, checking ~/.nvm..."
  if [ -d "~/.nvm" ]; then
    source ~/.nvm/nvm.sh
    node --version
  fi
fi
echo ""

echo "=========================================="
echo "✅ Discovery Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Find the vclop-backend directory path from above"
echo "2. cd into that directory"
echo "3. Run: git pull origin main"
echo "4. Run: npm install"
echo "5. Restart the application"
