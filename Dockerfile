FROM node:16-alpine

RUN mkdir -p /usr/deployman
WORKDIR /usr/deployman

COPY package*.json ./

RUN yarn install --production

COPY . .

RUN yarn build

ENTRYPOINT [ "yarn", "start" ]
