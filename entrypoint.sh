#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy --config prisma/prisma.config.ts

echo "Seeding initial data..."
node --import tsx prisma/seed.ts 2>/dev/null || echo "Seed skipped (file not found or error)"

echo "Starting application..."
exec node server.js
