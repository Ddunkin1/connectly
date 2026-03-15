#!/usr/bin/env bash
# Allow MySQL connections from the Sail app container (fixes "Host '172.18.0.x' is not allowed").
# Run from project root: ./database/mysql/fix-mysql-hosts.sh
# Requires: Sail up (./vendor/bin/sail up -d). Uses DB_PASSWORD from .env or "password".

set -e
cd "$(dirname "$0")/../.."
DB_PASS="password"
if [ -f .env ]; then
  val=$(grep -E '^DB_PASSWORD=' .env | cut -d= -f2-)
  [ -n "$val" ] && DB_PASS="$val"
fi
echo "Allowing MySQL users to connect from any host (e.g. app container)..."
./vendor/bin/sail exec mysql mysql -u root -p"${DB_PASS}" -e "
DROP USER IF EXISTS 'root'@'%';
CREATE USER 'root'@'%' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
DROP USER IF EXISTS 'sail'@'%';
CREATE USER 'sail'@'%' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`connectly_app\`.* TO 'sail'@'%';
FLUSH PRIVILEGES;
SELECT User, Host FROM mysql.user WHERE User IN ('root','sail');
"
echo "Done. Run: ./vendor/bin/sail artisan migrate"
