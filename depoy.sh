set -e  # Exit immediately if any command fails

echo "[1/4] Building client..."
cd client/ && npm run build
cd ..

echo "[2/4] Copying dist to web root..."
cp -r client/dist/ /var/www/cpms-final

echo "[3/4] Reloading nginx..."
systemctl reload nginx

echo "[4/4] Restarting PM2 app..."
pm2 restart vista

echo "✅ Deployment complete."
