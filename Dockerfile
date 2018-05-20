FROM node:boron
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN yarn global add node-gyp
COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app
RUN node -v
RUN yarn install
COPY . /usr/src/app
CMD ["node", "server.js"]
