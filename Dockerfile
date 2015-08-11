FROM iojs:1.8.4

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

CMD ["iojs", "server.js"]
EXPOSE 3000