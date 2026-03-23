#!/bin/sh
set -e

mkdir -p /app/data
npx prisma generate
npx prisma db push
if [ "$RUN_SEED_ON_STARTUP" = "true" ]; then
  node prisma/seed.js
fi
node src/server.js
