#!/bin/bash

# Source environment variables
source /Users/hungcq/projects/pscit/backend/.env

# Local database connection string
LOCAL_DB="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Remote database connection string
REMOTE_DB="postgresql://${REMOTE_DB_USER}:${REMOTE_DB_PASSWORD}@${REMOTE_DB_HOST}:${REMOTE_DB_PORT}/${REMOTE_DB_NAME}"

# Create dump file
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

# Drop all data and recreate tables in the remote database
echo "Recreating schema in remote database..."
psql "${REMOTE_DB}" << EOF
-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS book_copies CASCADE;
DROP TABLE IF EXISTS book_authors CASCADE;
DROP TABLE IF EXISTS book_categories CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create role if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hungcq') THEN
        CREATE ROLE hungcq;
    END IF;
END
\$\$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hungcq;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hungcq;
EOF

if [ $? -ne 0 ]; then
    echo "Error: Failed to recreate schema in remote database"
    rm -f "${DUMP_FILE}"
    exit 1
fi

# Restore the dump to the remote database
echo "Restoring data to remote database..."
pg_restore -v -d "${REMOTE_DB}" "${DUMP_FILE}"

if [ $? -ne 0 ]; then
    echo "Error: Failed to restore data to remote database"
    rm -f "${DUMP_FILE}"
    exit 1
fi

# Clean up
echo "Cleaning up..."
rm -f "${DUMP_FILE}"

echo "Database sync completed successfully!" 