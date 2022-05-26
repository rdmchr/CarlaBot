#!/bin/sh

#find /app -print | sed -e "s;[^/]*/;|____;g;s;____|; |;g"

database_migration() {
    echo "Migrating the database..."
    npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
}

start_bot() {
  database_migration
  node ./apps/bot/dist/index.js
}

start_server() {
  database_migration
  node ./apps/server/dist/index.js
}


case "$1" in
    bot)
        echo "Starting the bot..."
        start_bot
        ;;
    server)
        echo "Starting the server"
        start_server
        ;;
    *)
        echo "Invalid scope. Select one of the following: bot, server"
        exit 1
        ;;
esac
