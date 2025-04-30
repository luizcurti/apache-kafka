FROM node:20

WORKDIR /app

RUN apt-get update && \
    apt-get install -y build-essential librdkafka-dev && \
    npm install -g npm

COPY package*.json ./
RUN npm install

CMD ["tail", "-f", "/dev/null"]