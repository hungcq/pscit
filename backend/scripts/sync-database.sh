#!/bin/bash

# Source environment variables
source /Users/hungcq/projects/pscit/backend/.env

LOCAL_DB="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
REMOTE_DB_NAME="${REMOTE_DB_NAME}"
REMOTE_DB="postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@${REMOTE_DB_HOST}:${REMOTE_DB_PORT}/postgres"

DUMP_FILE="./pscit_dump.sql"

echo "Starting database sync..."

# Dump the local database
echo "Dumping local database..."
pg_dump -F c -b -v -f "${DUMP_FILE}" "${LOCAL_DB}"
if [ $? -ne 0 ]; then
    echo "Error: Failed to dump local database"
    rm -f "${DUMP_FILE}"
    exit 1
fi

# Drop and recreate remote database
echo "Dropping and recreating remote database..."
psql "${REMOTE_DB}" << EOF
REVOKE CONNECT ON DATABASE pscit FROM public;
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'pscit' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${REMOTE_DB_NAME};
CREATE DATABASE ${REMOTE_DB_NAME} WITH OWNER = '${REMOTE_DB_USER}' ENCODING = 'UTF8';
EOF

if [ $? -ne 0 ]; then
    echo "Error: Failed to recreate remote database"
    rm -f "${DUMP_FILE}"
    exit 1
fi

# Use the actual remote DB now for restore
REMOTE_DB_FULL="postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@${REMOTE_DB_HOST}:${REMOTE_DB_PORT}/${REMOTE_DB_NAME}"

echo "Restoring data to remote database..."
pg_restore -v -d "${REMOTE_DB_FULL}" "${DUMP_FILE}"
if [ $? -ne 0 ]; then
    echo "Error: Failed to restore data to remote database"
    rm -f "${DUMP_FILE}"
    exit 1
fi

# Clean up
rm -f "${DUMP_FILE}"
echo "Database sync completed successfully!"
