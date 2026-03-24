# Kafka Connectors — MySQL to MongoDB CDC

Real-time data replication from MySQL to MongoDB using Kafka Connect with a Debezium source connector and a MongoDB sink connector.

## Architecture

```
MySQL (Source) → Debezium Connector → Kafka → MongoDB Connector → MongoDB (Sink)
```

## Features

- **Real-time CDC** (Change Data Capture) — captures INSERT, UPDATE, DELETE from MySQL binlog
- **Scoped capture** — only the `kafkadb` database and relevant tables are captured
- **Dedicated CDC user** — Debezium uses a least-privilege MySQL account, not root
- **All credentials via environment variables** — no secrets in source files
- **Health checks** on all services — `depends_on` with `condition: service_healthy`
- **Web interfaces** for monitoring and administration
- **Pinned image versions** — reproducible builds

## Services

| Service | Port | Description | Interface |
|---------|------|-------------|-----------|
| MySQL | 33600 | Source database | CLI / MySQL tools |
| MongoDB | 27017 | Target database | Mongo Express |
| Kafka | 9092, 9094 | Message broker | Control Center |
| ZooKeeper | 2181 | Kafka coordination | — |
| Kafka Connect | 8083 | Connector runtime | REST API |
| Control Center | 9021 | Confluent management UI | Web UI |
| Mongo Express | 8085 | MongoDB admin UI | Web UI |

## Setup

### 1. Configure environment variables

```bash
cp .env.example .env
# Fill in the values — never commit .env to version control
```

**Required variables** (see `.env.example` for full list):

| Variable | Description |
|----------|-------------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password |
| `MONGO_ROOT_USERNAME` | MongoDB admin username |
| `MONGO_ROOT_PASSWORD` | MongoDB admin password |
| `MONGO_EXPRESS_USER` | Mongo Express UI username |
| `MONGO_EXPRESS_PASSWORD` | Mongo Express UI password |
| `MYSQL_CDC_USER` | Dedicated Debezium MySQL user |
| `MYSQL_CDC_PASSWORD` | Password for the Debezium user |

### 2. Start all services

```bash
docker-compose up -d

# Check service health
docker-compose ps

# Follow Kafka Connect logs
docker-compose logs -f kafka-connect
```

### 3. Initialise the MySQL database

```bash
# Via Makefile (recommended)
make connectors-setup-mysql

# Or manually
docker-compose exec -T mysql mysql -u root kafkadb < scripts/setup-mysql.sql
```

This script creates the schema (`categories`, `products`, `orders`, `order_items`), inserts sample data, and creates the dedicated `debezium` CDC user with the minimum required privileges.

> **Note:** Update the `debezium` user password in `setup-mysql.sql` to match `MYSQL_CDC_PASSWORD` in your `.env` before running.

### 4. Create source and sink connectors

#### Option A — Makefile

```bash
make create-mysql-connector
make create-mongo-connector
```

#### Option B — REST API

```bash
# MySQL source connector — reads from the Debezium CDC user
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mysql-source-connector",
    "config": {
      "connector.class": "io.debezium.connector.mysql.MySqlConnector",
      "tasks.max": "1",
      "database.hostname": "mysql",
      "database.port": "3306",
      "database.user": "<MYSQL_CDC_USER>",
      "database.password": "<MYSQL_CDC_PASSWORD>",
      "database.server.id": "1",
      "database.server.name": "mysql-server",
      "database.include.list": "kafkadb",
      "table.include.list": "kafkadb.categories,kafkadb.products,kafkadb.orders,kafkadb.order_items",
      "database.history.kafka.bootstrap.servers": "kafka:9092",
      "database.history.kafka.topic": "mysql_history"
    }
  }'

# MongoDB sink connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mongodb-sink-connector",
    "config": {
      "connector.class": "com.mongodb.kafka.connect.MongoSinkConnector",
      "tasks.max": "1",
      "topics": "mysql-server.kafkadb.categories",
      "connection.uri": "mongodb://<MONGO_ROOT_USERNAME>:<MONGO_ROOT_PASSWORD>@mongodb/",
      "database": "kafkadb",
      "transforms": "extractAddress",
      "transforms.extractAddress.type": "org.apache.kafka.connect.transforms.ExtractField$Value",
      "transforms.extractAddress.field": "after"
    }
  }'
```

### 5. Verify replication

```bash
# List Kafka topics
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# Consume raw CDC events
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic mysql-server.kafkadb.categories \
  --from-beginning
```

Open **Mongo Express** at http://localhost:8085 and browse the `kafkadb` → `categories` collection.

### 6. Test real-time changes

```bash
# Access MySQL
make connectors-mysql
```

```sql
INSERT INTO categories (name, description, price) VALUES ('Home & Garden', 'Furniture and tools', 199.99);
UPDATE categories SET description = 'Updated description' WHERE id = 1;
DELETE FROM categories WHERE id = 3;
```

Changes appear in MongoDB in real time.

## Monitoring

### Web interfaces

| Interface | URL |
|-----------|-----|
| Kafka Control Center | http://localhost:9021 |
| Mongo Express | http://localhost:8085 |
| Kafka Connect REST | http://localhost:8083 |

### REST API reference

```bash
# List all connectors
curl -s http://localhost:8083/connectors | jq

# Check connector status
curl -s http://localhost:8083/connectors/mysql-source-connector/status | jq

# Restart a connector
curl -X POST http://localhost:8083/connectors/mysql-source-connector/restart

# Delete a connector
curl -X DELETE http://localhost:8083/connectors/mysql-source-connector

# Kafka Connect worker info
curl -s http://localhost:8083/ | jq
```

### Useful commands

```bash
# Connector logs
docker-compose logs -f kafka-connect

# Monitor MySQL binlog
docker-compose exec mysql bash -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql -u root -e "SHOW BINARY LOGS;"'

# MongoDB shell
make connectors-mongo
```

## Security

- All passwords are loaded from environment variables — never hardcoded.
- The Debezium connector uses a dedicated `debezium` user with only the minimum required grants (`SELECT`, `RELOAD`, `SHOW DATABASES`, `REPLICATION SLAVE`, `REPLICATION CLIENT`).
- Mongo Express is protected with HTTP Basic Auth credentials set via `.env`.
- The `.env` file is git-ignored; `.env.example` is provided as a safe template.

## Troubleshooting

### Connector fails to start

```bash
# Detailed error
curl -s http://localhost:8083/connectors/mysql-source-connector/status | jq
docker-compose logs kafka-connect | grep -i error
```

### No data appearing in MongoDB

1. Confirm MySQL binary logging is enabled: the `--binlog-format=ROW` flag is set in `docker-compose.yaml`
2. Check that the Kafka topic `mysql-server.kafkadb.categories` was created
3. Verify the transform field name (`after`) matches your connector version

### Debezium user permission error

```bash
# Verify grants
docker-compose exec mysql bash -c \
  'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql -u root -e "SHOW GRANTS FOR debezium@\"%\";"'
```

### Performance tuning

For high-throughput scenarios, tune the MongoDB sink:

```json
{
  "max.batch.size": "2048",
  "bulk.write.ordered": "false"
}
```

## Project Structure

```
kafka-connectors/
├── connectors/
│   ├── mysql.properties      # Debezium MySQL source config (credentials via env vars)
│   └── mongodb.properties    # MongoDB sink config (credentials via env vars)
├── scripts/
│   └── setup-mysql.sql       # Schema, sample data, and Debezium user setup
├── docker-compose.yaml       # Full stack with health checks and pinned versions
├── .env.example              # Environment variable template
└── README.md                 # This file
```

## 📁 Project Structure

```
kafka-connectors/
├── docker-compose.yaml    # Service orchestration
├── connectors/
│   ├── mysql.properties   # Debezium MySQL source config
│   └── mongodb.properties # MongoDB sink config
├── scripts/
│   └── setup-mysql.sql   # Database initialization
└── README.md             # This documentation
```

## 🔗 Useful Links

- [Kafka Control Center](http://localhost:9021/)
- [Mongo Express](http://localhost:8085/)
- [Kafka Connect REST API](http://localhost:8083/)
- [Debezium Documentation](https://debezium.io/documentation/)
- [MongoDB Kafka Connector](https://docs.mongodb.com/kafka-connector/current/)

## 📝 License

This project is licensed under the MIT License.
