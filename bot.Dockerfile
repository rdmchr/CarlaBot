FROM node:16-alpine

WORKDIR /app

RUN apk add g++ make py3-pip
RUN apk add --no-cache --upgrade bash

COPY out/full /app
RUN yarn install --production
RUN yarn add turbo -W

RUN yarn run turbo run build --no-cache

COPY /start.sh /app

CMD [ "bash", "/app/start.sh", "bot" ]