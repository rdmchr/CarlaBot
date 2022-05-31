FROM node:16-alpine

WORKDIR /app

COPY out/full /app
RUN yarn install --production
RUN yarn add turbo -W

RUN yarn run turbo run build --no-cache

CMD ["node", "/app/apps/bot/dist/index.js"]