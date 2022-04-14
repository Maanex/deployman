FROM node:16-alpine

RUN mkdir -p /usr/deployman
WORKDIR /usr/deployman

COPY package*.json ./

RUN yarn install --production

COPY . .
COPY config.docker.js config.js

RUN yarn build

ENTRYPOINT [ "yarn", "start" ]
