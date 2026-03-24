# Kafka Node.js Producer & Consumer

Node.js implementation of Kafka producers and consumers using the `node-rdkafka` library (librdkafka C bindings).

## 🚀 Features

- **Two producers** — `producer.js` (event-driven) and `producer2.js` (async/await with per-message delivery confirmation)
- **Reliable delivery tracking** — delivery reports correlated via `opaque` id, not invalid callbacks
- **Resilient consumer** — manual commit, exponential backoff reconnection, graceful shutdown
- **All configuration via environment variables** — no hardcoded values
- **Docker Compose** with health checks, service dependencies, and Kafka UI
- **ESLint** configured for consistent code style

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 20+ (if running outside container)

## 🛠️ Setup

### 1. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your values
```

### 2. Install dependencies (only needed when running outside Docker)

```bash
npm ci
```

## 🐳 Running with Docker

### Start the full environment

```bash
npm run docker:up
# or
docker-compose up -d
```

### View logs

```bash
npm run docker:logs
docker-compose logs -f kafka
docker-compose logs -f app
```

### Stop

```bash
npm run docker:down
```

## 🔧 Running the applications

### Inside the container

```bash
# Main producer (event-driven)
docker-compose exec app npm run producer

# Alternative producer (async/await + delivery confirmation per message)
docker-compose exec app npm run producer2

# Consumer (in a separate terminal)
docker-compose exec app npm run consumer
```

### Locally (outside Docker)

```bash
# Set KAFKA_BROKERS=localhost:9094 in .env to reach Kafka from the host

npm run producer
npm run consumer

# Development with auto-reload
npm run dev:producer
npm run dev:consumer
```

## 🖥️ Web Interfaces

After `docker-compose up -d`:

- **Kafka UI** — http://localhost:8080 (topics, consumer groups, messages)
- **Control Center** — http://localhost:9021 (official Confluent interface)

## 📊 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Runs `producer.js` |
| `npm run producer` | Runs `producer.js` |
| `npm run producer2` | Runs `producer2.js` (async/await with delivery confirmation) |
| `npm run consumer` | Runs `consumer.js` |
| `npm run dev:producer` | Producer with auto-reload (nodemon) |
| `npm run dev:consumer` | Consumer with auto-reload (nodemon) |
| `npm run dev:producer2` | producer2 with auto-reload (nodemon) |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm test` | Run tests (`node --test`) |
| `npm run docker:up` | Start Docker environment |
| `npm run docker:down` | Stop Docker environment |
| `npm run docker:logs` | View Docker logs |

## ⚙️ Configuration

All configuration is done via environment variables. Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BROKERS` | `kafka:9092` | Broker address (use `localhost:9094` outside Docker) |
| `KAFKA_TOPIC` | `testKafka` | Topic name |
| `KAFKA_GROUP_ID` | `nodeapp-group` | Consumer group ID |
| `KAFKA_CLIENT_ID` | `node-kafka-client` | Client identifier |
| `KAFKA_AUTO_OFFSET_RESET` | `earliest` | Where to start reading if no offset exists |
| `KAFKA_ENABLE_AUTO_COMMIT` | `false` | Auto-commit offsets (disabled for manual control) |
| `KAFKA_SESSION_TIMEOUT` | `30000` | Consumer session timeout in ms |
| `KAFKA_HEARTBEAT_INTERVAL` | `3000` | Heartbeat interval in ms |
| `KAFKA_ACKS` | `all` | Producer acknowledgement level |
| `KAFKA_ENABLE_IDEMPOTENCE` | `true` | Exactly-once producer semantics |
| `KAFKA_RETRIES` | `3` | Producer retry attempts |
| `KAFKA_BATCH_SIZE` | `16384` | Producer batch size in bytes |
| `KAFKA_LINGER_MS` | `10` | Producer linger time in ms |
| `KAFKA_REQUEST_TIMEOUT_MS` | `30000` | Producer request timeout in ms |
| `MESSAGE_COUNT` | `50` | Number of messages sent by `producer.js` |
| `MAX_RECONNECT_ATTEMPTS` | `5` | Max consumer reconnect attempts |
| `LOG_LEVEL` | `info` | Log verbosity (`debug` \| `info`) |
| `NODE_ENV` | `development` | Application environment |

## 🏗️ Architecture notes

### producer.js
Event-driven producer. Connects, sends N messages in a loop, flushes, disconnects, and exits. Delivery tracking is done via `delivery-report` events.

### producer2.js
Async/await producer. Each `publishMessage()` call returns a Promise that resolves or rejects based on the actual Kafka delivery report — using `crypto.randomUUID()` as an `opaque` correlation id passed through `produce()` and returned in the `delivery-report` event.

> **Why opaque?** The `node-rdkafka` `produce()` method does **not** accept a callback. The 6th argument is an `opaque` value that is passed back untouched in the delivery-report event — this is the correct pattern for correlating individual messages to their Promise.

### consumer.js
Flow-mode consumer (`consumer.consume()`). Manual offset commit after each successful message. On processing errors, the message is committed anyway to prevent infinite reprocessing — in production, route to a Dead Letter Queue (DLQ) instead.

## 🔒 Security

- Docker image uses `node:20-alpine` and runs as the non-root `node` user
- No secrets in source code — all credentials via `.env`
- `.env` is git-ignored; `.env.example` is provided as a template

## 🔍 Monitoring and Debug

Enable verbose logging in `.env`:

```env
LOG_LEVEL=debug
```

The consumer logs a heartbeat every 30 seconds:

```
💓 Heartbeat - Messages processed: 150
```

Use **Kafka UI** at http://localhost:8080 to inspect topics, partitions, consumer group lag, and individual messages.

## 🚨 Troubleshooting

### Cannot connect to Kafka

```bash
# Check service health
docker-compose ps

# Check Kafka broker logs
docker-compose logs kafka
```

### Consumer not receiving messages

1. Confirm the topic exists in Kafka UI
2. Check `KAFKA_GROUP_ID` matches what was used before
3. Verify `KAFKA_AUTO_OFFSET_RESET=earliest` if the topic already has messages

### High producer latency

Tune for throughput (at the cost of latency):

```env
KAFKA_BATCH_SIZE=65536
KAFKA_LINGER_MS=50
```

## 📁 Project Structure

```
kafka-node-producer-consumer/
├── producer.js           # Event-driven producer
├── producer2.js          # Async/await producer with per-message delivery tracking
├── consumer.js           # Flow-mode consumer with manual commit
├── config.js             # Centralised configuration + validation
├── .eslintrc.json        # ESLint rules
├── package.json          # Scripts and dependencies
├── .env.example          # Environment variable template
├── Dockerfile            # Alpine image, non-root user
├── docker-compose.yaml   # Full environment with health checks
└── readme.md             # This file
```
