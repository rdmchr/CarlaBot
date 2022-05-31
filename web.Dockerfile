# stage build
FROM node:16-alpine

WORKDIR /app

# copy everything to the container
COPY out/full .

# clean install all dependencies
RUN yarn install

# build SvelteKit app
RUN yarn run build


# stage run
FROM node:16-alpine

WORKDIR /app

# copy dependency list
COPY --from=0 /app/apps/web/package.json ./
#COPY --from=0 /app/apps/web/yarn.lock ./

# clean install dependencies, no devDependencies, no prepare script
RUN yarn install --production

# copy built SvelteKit app to /app
COPY --from=0 /app/apps/web/build ./

EXPOSE 3000
CMD ["node", "./index.js"]