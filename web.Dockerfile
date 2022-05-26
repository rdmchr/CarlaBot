FROM node:16 AS builder

# create root application folder
WORKDIR /app

# copy configs to /app folder
COPY out/yarn.lock ./
# copy source code to /app/src folder
COPY out/full /app

# check files list
RUN ls -a

RUN yarn install --pure-lockfile
RUN yarn global add turbo typescript
RUN yarn run build

FROM node:16
# make the 'app' folder the current working directory
WORKDIR /app
RUN npm install -g http-server
# Copy the respective nginx configuration files
COPY --from=builder /app/apps/web/dist /app
EXPOSE 8080
CMD [ "http-server", "/app", "--proxy", "http://localhost:8080?" ]
