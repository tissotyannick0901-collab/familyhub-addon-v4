#!/bin/bash
set -e
echo "=== FamilyHub v4.0.0 ==="

# Lire config HA
SECRET=""
if [ -f /data/options.json ]; then
  SECRET=$(jq -r '.secret // ""' /data/options.json 2>/dev/null || echo "")
fi

export PORT=3001
export DB_PATH=/data/familyhub.db
export SECRET="$SECRET"

echo "DB     : $DB_PATH"
echo "Auth   : ${SECRET:+oui}"

# nginx
nginx
echo "nginx OK"
sleep 1

# Node.js PID 1
cd /app
exec node server.js
