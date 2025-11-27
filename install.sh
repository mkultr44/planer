#!/usr/bin/env bash
set -euo pipefail

if [[ $(id -u) -ne 0 ]]; then
  echo "Dieses Setup-Skript muss als root oder via sudo ausgeführt werden." >&2
  exit 1
fi

PROJECT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_NAME="dienstplan-generator"
SYSTEMD_SERVICE_NAME="${PROJECT_NAME}.service"
DEFAULT_APP_PORT=4310
DEFAULT_SYSTEM_USER="dienstplan"

prompt() {
  local prompt_text=$1
  local default_value=${2-}
  local var
  if [[ -n "$default_value" ]]; then
    read -rp "$prompt_text [$default_value]: " var
    echo "${var:-$default_value}"
  else
    while true; do
      read -rp "$prompt_text: " var
      [[ -n "$var" ]] && { echo "$var"; break; }
      echo "Angabe erforderlich." >&2
    done
  fi
}

DOMAIN=$(prompt "Domain für die Anwendung (z. B. plan.example.com)")
ADMIN_EMAIL=$(prompt "E-Mail-Adresse für Let's Encrypt Benachrichtigungen")
APP_PORT=$(prompt "Interner Port für Next.js (nicht 80/443, Standard ${DEFAULT_APP_PORT})" "$DEFAULT_APP_PORT")
SYSTEM_USER=$(prompt "Systembenutzer für den Dienst" "$DEFAULT_SYSTEM_USER")

if ! id -u "$SYSTEM_USER" >/dev/null 2>&1; then
  useradd --system --create-home --shell /usr/sbin/nologin "$SYSTEM_USER"
fi

apt-get update
apt-get install -y ca-certificates curl gnupg sqlite3 build-essential nginx python3-certbot-nginx git sudo

if ! command -v node >/dev/null 2>&1 || [[ $(node -v | sed 's/v//;s/\..*//') -lt 18 ]]; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  NODE_MAJOR=20
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" >/etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
fi

cd "$PROJECT_DIR/$PROJECT_NAME"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

chown -R "$SYSTEM_USER":"$SYSTEM_USER" "$PROJECT_DIR/$PROJECT_NAME"

runuser -u "$SYSTEM_USER" -- bash -c "
  cd \"$PROJECT_DIR/$PROJECT_NAME\" &&
  npm install &&
  npx prisma generate &&
  (npx prisma migrate deploy || npx prisma db push) &&
  npm run build
"

cat <<SERVICE >/etc/systemd/system/$SYSTEMD_SERVICE_NAME
[Unit]
Description=Dienstplan Generator Next.js Service
After=network.target

[Service]
Type=simple
User=$SYSTEM_USER
WorkingDirectory=$PROJECT_DIR/$PROJECT_NAME
Environment=PORT=$APP_PORT
Environment=NODE_ENV=production
ExecStart=$PROJECT_DIR/$PROJECT_NAME/node_modules/.bin/next start -p $APP_PORT
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable --now "$SYSTEMD_SERVICE_NAME"

NGINX_CONF_PATH="/etc/nginx/sites-available/${PROJECT_NAME}_${DOMAIN}.conf"
cat <<NGINX >"$NGINX_CONF_PATH"
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf "$NGINX_CONF_PATH" "/etc/nginx/sites-enabled/${PROJECT_NAME}_${DOMAIN}.conf"
nginx -t && systemctl reload nginx

certbot --nginx \
  --non-interactive \
  --agree-tos \
  --email "$ADMIN_EMAIL" \
  -d "$DOMAIN"

systemctl restart nginx
systemctl status "$SYSTEMD_SERVICE_NAME" --no-pager

echo "Installation abgeschlossen. Anwendung läuft hinter https://$DOMAIN"
