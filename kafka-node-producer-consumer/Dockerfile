FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ librdkafka-dev

COPY package*.json ./
RUN npm ci

# Run as non-root user (security best practice — OWASP A05)
RUN chown -R node:node /app
USER node

CMD ["tail", "-f", "/dev/null"]