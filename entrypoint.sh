#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy --config prisma/prisma.config.ts

echo "Starting application..."
exec node server.js
