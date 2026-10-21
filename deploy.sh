#!/bin/bash
# Script de déploiement — Ma Tontine Faso
# Serveur : Ubuntu/Debian avec Python 3.11+, PostgreSQL, Nginx

set -e

APP_DIR="/opt/tontine"
DOMAIN="matontine.docteurpc.org"

echo "=== Ma Tontine Faso — Déploiement ==="

# 1. Installer les dépendances système
echo "[1/7] Dépendances système..."
sudo apt update && sudo apt install -y python3 python3-pip python3-venv postgresql nginx certbot python3-certbot-nginx

# 2. Créer la base PostgreSQL
echo "[2/7] Base de données PostgreSQL..."
sudo -u postgres psql -c "CREATE USER tontine_user WITH PASSWORD 'CHANGER_CE_MOT_DE_PASSE';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE tontine_db OWNER tontine_user;" 2>/dev/null || true

# 3. Copier les fichiers
echo "[3/7] Copie des fichiers..."
sudo mkdir -p $APP_DIR
sudo cp -r backend/* $APP_DIR/backend/
sudo cp -r dist/* $APP_DIR/dist/

# 4. Environnement Python
echo "[4/7] Environnement Python..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Configuration production
echo "[5/7] Configuration..."
cat > .env <<EOF
DATABASE_URL=postgresql://tontine_user:CHANGER_CE_MOT_DE_PASSE@localhost:5432/tontine_db
CORS_ORIGINS=https://$DOMAIN
EOF

# 6. Appliquer les migrations
echo "[6/7] Migrations..."
python -m alembic upgrade head

# 7. Service systemd
echo "[7/7] Service systemd..."
sudo tee /etc/systemd/system/tontine.service > /dev/null <<EOF
[Unit]
Description=Ma Tontine Faso API
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$APP_DIR/backend/venv/bin
ExecStart=$APP_DIR/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable tontine
sudo systemctl restart tontine

# Config Nginx
sudo tee /etc/nginx/sites-available/tontine > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/tontine /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== Déploiement terminé ==="
echo "HTTP : http://$DOMAIN"
echo ""
echo "Pour activer HTTPS :"
echo "  sudo certbot --nginx -d $DOMAIN"
echo ""
echo "IMPORTANT : Changez le mot de passe PostgreSQL dans :"
echo "  $APP_DIR/backend/.env"
echo "  et relancez : sudo systemctl restart tontine"
