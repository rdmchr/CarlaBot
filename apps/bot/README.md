# Carla Discord Bot

## Environment variables

- **DISCORD_TOKEN**: Discord bot token
- **HETZNER_TOKEN** (optional): Hetzner token
- **WEBHOOK_SECRET**: Webhook secret; make sure to pick a strong secret, if you expose the ports of the bots' webhook server
- **JWA_ID**: JsonWHOISAPI.com ID
- **JWA_SECRET**: JsonWHOISAPI.com secret
- **DATABASE_URL**: Postgres database URL
- **GLOT_TOKEN**: Glot api token
- **TWITTER_TOKEN**: Twitter api bearer token
- **AWS_KEY_ID**: AWS access key id
- **AWS_SECRET_KEY**: AWS secret access key
- **AWS_BUCKET_NAME**: AWS S3 bucket name

## How to generate the webhook secret

```bash
openssl rand -hex 32
```