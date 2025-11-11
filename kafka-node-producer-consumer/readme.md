# Kafka Node.js Producer & Consumer

This project demonstrates the implementation of a Kafka Producer and Consumer using Node.js with the `node-rdkafka` library.

## 🚀 Features

- **Robust Producer** with delivery reports and error handling
- **Resilient Consumer** with reconnection strategy and manual commit
- **External configuration** via environment variables
- **Docker Compose** with health checks and Kafka UI
- **NPM Scripts** for development and production
- **Graceful shutdown** for both producer and consumer

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (if running outside container)

## 🛠️ Setup

### 1. Clone and configure

```bash
git clone <repo-url>
cd kafka-node-producer-consumer
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit the .env file as needed
```

### 3. Install dependencies (optional, if running outside Docker)

```bash
npm install
```

## 🐳 Running with Docker

### Start complete environment

```bash
# Start all services
npm run docker:up

# Or manually
docker-compose up -d
```

### Check logs

```bash
# All services logs
npm run docker:logs

# Specific logs
docker-compose logs -f kafka
docker-compose logs -f app
```

### Stop environment

```bash
npm run docker:down
```

## 🔧 Running applications

### Inside container

```bash
# Producer
docker-compose exec app npm run producer

# Consumer (in another terminal)
docker-compose exec app npm run consumer

# Alternative producer
docker-compose exec app npm run producer2
```

### Locally (outside Docker)

```bash
# Make sure Kafka is running in Docker
# and configure KAFKA_BROKERS=localhost:9094 in .env

# Producer
npm run producer

# Consumer
npm run consumer

# Development with auto-reload
npm run dev:producer
npm run dev:consumer
```

## 🖥️ Web Interfaces

After running `docker-compose up -d`, access:

- **Kafka UI**: http://localhost:8080 (Modern Kafka interface)
- **Control Center**: http://localhost:9021 (Official Confluent interface)

## 📊 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Runs default producer |
| `npm run producer` | Runs producer |
| `npm run consumer` | Runs consumer |
| `npm run producer2` | Runs alternative producer |
| `npm run dev:producer` | Producer with auto-reload |
| `npm run dev:consumer` | Consumer with auto-reload |
| `npm run docker:up` | Start Docker environment |
| `npm run docker:down` | Stop Docker environment |
| `npm run docker:logs` | View Docker logs |

## ⚙️ Main Configurations

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BROKERS` | `kafka:9092` | Kafka broker addresses |
| `KAFKA_TOPIC` | `testKafka` | Topic name |
| `KAFKA_GROUP_ID` | `nodeapp-group` | Consumer group ID |
| `MESSAGE_COUNT` | `50` | Number of messages (producer) |
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |

### Producer Features

- ✅ **Delivery reports** for delivery confirmation
- ✅ **Idempotence** enabled by default
- ✅ **Automatic retry** with exponential backoff
- ✅ **Graceful shutdown** with message flush
- ✅ **External configuration** via environment

### Consumer Features

- ✅ **Manual commit** for precise control
- ✅ **Automatic reconnection strategy**
- ✅ **Health monitoring** with heartbeat
- ✅ **Robust error handling**
- ✅ **Graceful shutdown** with statistics

## 🔍 Monitoring and Debug

### Detailed logs

Configure `LOG_LEVEL=debug` in `.env` for verbose logs.

### Health Check

The consumer includes a heartbeat that prints statistics every 30 seconds:

```
💓 Heartbeat - Messages processed: 150
```

### Kafka UI

Use the web interface at http://localhost:8080 to:

- View topics and partitions
- Monitor consumer groups
- Inspect messages
- Check consumer lag

## 🚨 Troubleshooting

### Connection error

```bash
# Check if Kafka is running
docker-compose ps

# Check Kafka logs
docker-compose logs kafka
```

### Consumer not receiving messages

1. Check if topic exists in Kafka UI
2. Confirm `KAFKA_GROUP_ID` is correct
3. Check `auto.offset.reset` in config

### Performance

For high throughput, adjust these settings:

```env
# Producer
KAFKA_BATCH_SIZE=65536
KAFKA_LINGER_MS=50

# Consumer  
KAFKA_MAX_POLL_RECORDS=2000
```

## 📁 Project Structure

```
kafka-node-producer-consumer/
├── producer.js          # Main producer
├── producer2.js         # Alternative producer
├── consumer.js          # Consumer
├── config.js           # Centralized configurations
├── package.json        # Scripts and dependencies
├── .env.example        # Configuration template
├── Dockerfile          # Application container
├── docker-compose.yaml # Complete orchestration
└── README.md          # This documentation
```
