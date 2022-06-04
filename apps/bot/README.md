# Carla Discord Bot

## Environment variables

- **DISCORD_TOKEN**: Discord bot token
- **HETZNER_TOKEN** (optional): Hetzner token
- **WEBHOOK_SECRET**: Webhook secret; make sure to pick a strong secret, if you expose the ports of the bots' webhook server
- **JWA_ID**: JsonWHOISAPI.com ID
- **JWA_SECRET**: JsonWHOISAPI.com secret
- **DATABASE_URL**: Postgres database URL
- **GLOT_TOKEN**: Glot api token
- **WEB_URL**: The URL of the website
- **SOCIAL_CACHE_URL**: The URL of the social cache
- **TWITTER_TOKEN**: Twitter api bearer token

## How to generate the webhook secret

```bash
openssl rand -hex 32
```