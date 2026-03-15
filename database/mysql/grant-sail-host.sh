#!/usr/bin/env bash
# Allow root and Sail user to connect from any host (app container, host.docker.internal, etc.).
# Runs in MySQL container at first init. For existing volumes run: ./vendor/bin/sail exec mysql /var/www/html/database/mysql/fix-mysql-hosts.sh

set -e
mysql --user=root --password="$MYSQL_ROOT_PASSWORD" <<-EOSQL
    CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';
    GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
    CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
    GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%';
    FLUSH PRIVILEGES;
EOSQL
