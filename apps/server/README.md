# Carla Web Server

## Environment variables

- **JWT_SECRET**: The secret used to sign JWT tokens.
- **DATABASE_URL**: The URL of the database. (example: "postgresql://postgres:postgres@localhost:5432/postgres?schema=public")
- **DISCORD_OAUTH_CLIENT_ID**: The client ID of the Discord Bot.
- **DISCORD_OAUTH_CLIENT_SECRET**: The client secret of the Discord OAuth.
- **WEBHOOK_SECRET**: Webhook secret; make sure to pick a strong secret, if you expose the ports of the bots' webhook server
- **WEBHOOK_URL**: The URL of the webhook server.
- **WEB_URL**: The URL of the web server.
- **SERVER_ID**: The ID of the Discord server.
- **SERVER_URL**: The URL of this server.

## How to generate the JWT secret

```bash
openssl rand -hex 64
# or if you want to use the Node REPL
require('crypto').randomBytes(64).toString('hex')
```