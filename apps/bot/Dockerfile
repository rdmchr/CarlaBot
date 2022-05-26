FROM node:16-alpine

# create root application folder
WORKDIR /app

# copy configs to /app folder
COPY package*.json ./
COPY tsconfig.json ./
# copy source code to /app/src folder
COPY src /app/src
# copy Prisma file to /app/prisma folder
COPY prisma /app/prisma
# copy start script to /app folder
COPY start.sh /app

# check files list
RUN ls -a

RUN npm install
RUN npm run build

CMD [ "./start.sh" ]