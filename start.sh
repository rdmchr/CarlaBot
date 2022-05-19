#!/bin/sh

npx prisma migrate deploy --schema=/app/prisma/schema.prisma
node /app/dist/index.js
