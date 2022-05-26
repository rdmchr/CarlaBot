FROM node:16

# create root application folder
WORKDIR /app

# copy configs to /app folder
COPY out/yarn.lock ./
#COPY tsconfig.json ./
# copy source code to /app/src folder
COPY out/full /app
# copy start script to /app folder
COPY start.sh /app

# check files list
RUN ls -a

RUN yarn install --pure-lockfile
RUN yarn global add turbo typescript
RUN yarn run build

EXPOSE 4000

CMD [ "./start.sh", "server" ]