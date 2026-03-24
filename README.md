# Apache Kafka Examples & Integrations

Hands-on examples for Apache Kafka — a distributed event streaming platform for building real-time data pipelines and streaming applications.

## Project Structure

```
apache-kafka/
├── kafka-node-producer-consumer/   # Node.js producers and consumer
├── kafka-connectors/               # MySQL → MongoDB CDC pipeline
├── Makefile                        # Unified commands for both projects
└── README.md                       # This file
```

## Projects

### kafka-node-producer-consumer

Node.js producers and consumer built on `node-rdkafka` (librdkafka C bindings).

- Two producer implementations: event-driven (`producer.js`) and async/await with per-message delivery confirmation (`producer2.js`)
- Consumer with manual offset commit and exponential backoff reconnection
- Graceful shutdown on SIGINT/SIGTERM with proper flush
- All configuration via environment variables — no hardcoded values
- Docker Compose with health checks and Kafka UI
- ESLint configured

[View documentation →](kafka-node-producer-consumer/readme.md)

### kafka-connectors

Change Data Capture (CDC) pipeline from MySQL to MongoDB using Kafka Connect.

- Debezium MySQL source connector — captures binlog events in real time
- MongoDB sink connector — replicates changes as documents
- Scoped to specific databases and tables
- Dedicated least-privilege Debezium MySQL user
- All credentials via environment variables
- Health checks on all services with pinned image versions

[View documentation →](kafka-connectors/README.md)

## Technologies

| Technology | Purpose |
|---|---|
| Apache Kafka | Distributed event streaming |
| Node.js | Producer / consumer runtime |
| node-rdkafka | Node.js bindings for librdkafka |
| Docker & Docker Compose | Containerisation |
| Confluent Platform (7.4.0) | Enterprise Kafka distribution |
| MySQL 8.0 | CDC source database |
| MongoDB 4.4 | CDC sink database |
| Kafka Connect | Connector framework |
| Debezium | Change data capture |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- `make` (optional, for Makefile shortcuts)
- Node.js 20+ (only if running outside containers)

### 1. Copy environment files

```bash
cp kafka-node-producer-consumer/.env.example kafka-node-producer-consumer/.env
cp kafka-connectors/.env.example kafka-connectors/.env
# Edit both .env files with your values before starting
```

### 2. Using Makefile (recommended)

```bash
# List all available commands
make help

# Start the Node.js environment
make node-up

# Run producer / consumer
make node-producer
make node-consumer

# Start the connectors environment
make connectors-up

# Initialise MySQL schema and sample data
make connectors-setup-mysql

# Create the Kafka connectors
make create-mysql-connector
make create-mongo-connector

# Start both environments
make up-all

# Check container status
make status

# Stop everything
make down-all

# Remove all containers, networks and volumes
make clean
```

### 3. Manual setup

```bash
# Node.js project
cd kafka-node-producer-consumer
docker-compose up -d
docker-compose exec app npm run producer
docker-compose exec app npm run consumer   # in another terminal

# Connectors project
cd kafka-connectors
docker-compose up -d
docker-compose exec -T mysql mysql -u root kafkadb < scripts/setup-mysql.sql
```

## Web Interfaces

| Interface | URL | Project |
|-----------|-----|---------|
| Kafka UI | http://localhost:8080 | Node.js |
| Control Center | http://localhost:9021 | Both |
| Mongo Express | http://localhost:8085 | Connectors |
| Kafka Connect REST | http://localhost:8083 | Connectors |

## Security

- **No secrets in source code** — all credentials loaded from `.env`
- **`.env` is git-ignored** — `.env.example` is the safe template to commit
- **Dedicated Debezium user** — least-privilege MySQL account for CDC (not root)
- **Non-root Docker container** — the Node.js image runs as the `node` user

## Development

```bash
# Install Node.js dependencies
cd kafka-node-producer-consumer && npm ci

# Lint
npm run lint
npm run lint:fix

# Tests
npm test

# Development with auto-reload
npm run dev:producer
npm run dev:consumer
```

## Troubleshooting

### Services not starting

```bash
make status
make clean
make up-all
```

### Kafka connection errors

```bash
docker-compose logs kafka
docker-compose logs zookeeper
```

### Connectors failing

```bash
# Check connector status via REST
curl -s http://localhost:8083/connectors/mysql-source-connector/status | jq

# Check Kafka Connect logs
docker-compose logs kafka-connect | grep -i error
```

## Roadmap

- [ ] Schema Registry integration
- [ ] Kafka Streams processing examples
- [ ] Monitoring with Prometheus and Grafana
- [ ] SSL/SASL security configuration
- [ ] Unit and integration tests

## License

MIT — see individual project directories for details.

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Platform Documentation](https://docs.confluent.io/)
- [Debezium Documentation](https://debezium.io/documentation/)
- [node-rdkafka](https://github.com/Blizzard/node-rdkafka)
- [Kafka Connect Documentation](https://docs.confluent.io/platform/current/connect/index.html)

