#!/usr/bin/env bash
# Recover user data from an OLD Docker MySQL volume into the current database.
# Use this when you had users in the DB before switching Sail project (e.g. to connectlyapp)
# and Navicat now shows zero users because the app is using a new empty volume.
#
# Why it happened: Changing COMPOSE_PROJECT_NAME (or fixing Sail) created a NEW MySQL volume.
# Your old data is still in the old volume (e.g. connectly_sail-mysql). This script dumps
# from that volume and imports into the database Laravel/Navicat currently use.

set -e
cd "$(dirname "$0")/.."

BACKUP_FILE="connectly_app_recovery_$(date +%Y%m%d_%H%M%S).sql"
OLD_VOLUME="${1:-connectly_sail-mysql}"   # Try this first; or connectly_connectly-mysql-data

echo "=== Connectly DB recovery ==="
echo "Old volume to read from: $OLD_VOLUME"
echo "Backup file will be: $BACKUP_FILE"
echo ""

# 1. Start a temporary MySQL container with the OLD volume (so we can dump it)
echo "Starting temporary MySQL with old volume (port 3307)..."
docker run -d --name connectly-recovery-mysql \
  -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=recovery \
  -e MYSQL_DATABASE=connectly_app \
  -v "$OLD_VOLUME:/var/lib/mysql" \
  mysql:8.4

echo "Waiting for MySQL to be ready (up to 60s)..."
for i in {1..60}; do
  if docker exec connectly-recovery-mysql mysqladmin ping -h localhost -precovery 2>/dev/null; then
    echo "MySQL is ready."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "Timeout. Try again or use a different volume."
    docker rm -f connectly-recovery-mysql 2>/dev/null
    exit 1
  fi
  sleep 1
done

# 2. Dump the database from the old volume (stderr to /dev/null to hide password warning)
echo "Dumping connectly_app from old volume..."
docker exec connectly-recovery-mysql sh -c 'mysqldump -u root -precovery connectly_app 2>/dev/null' > "$BACKUP_FILE"
docker rm -f connectly-recovery-mysql 2>/dev/null

if [ ! -s "$BACKUP_FILE" ]; then
  echo "Dump failed or empty. Try another volume:"
  echo "  ./scripts/recover-users-from-old-volume.sh connectly_connectly-mysql-data"
  echo "  ./scripts/recover-users-from-old-volume.sh connectly-app_connectly-mysql-data"
  exit 1
fi
echo "Dump saved to $BACKUP_FILE ($(wc -l < "$BACKUP_FILE") lines)"

# 3. Import into current database
# Option A: Sail's MySQL container is running (connectlyapp-mysql-1)
if docker ps --format '{{.Names}}' | grep -q 'connectlyapp-mysql-1'; then
  echo "Importing into Sail's current MySQL (connectlyapp-mysql-1)..."
  docker exec -i connectlyapp-mysql-1 mysql -u sail -ppassword connectly_app < "$BACKUP_FILE"
  echo "Done. Refresh Navicat (127.0.0.1:3306, connectly_app) to see recovered users."
# Option B: No Sail MySQL container; assume MySQL on host (127.0.0.1:3306)
else
  echo "Sail MySQL container not running. Import manually into the DB Navicat uses:"
  echo "  mysql -h 127.0.0.1 -P 3306 -u sail -ppassword connectly_app < $BACKUP_FILE"
  echo "Or in Navicat: run the SQL file $BACKUP_FILE on database connectly_app."
fi
