# Kafka Connectors - MySQL to MongoDB

This project demonstrates real-time data replication from MySQL to MongoDB using Kafka Connect with Debezium source connector and MongoDB sink connector.

## 🏗️ Architecture

```
MySQL (Source) → Debezium Connector → Kafka → MongoDB Connector → MongoDB (Sink)
```

## 🚀 Features

- **Real-time CDC** (Change Data Capture) from MySQL
- **Automatic schema detection** and evolution
- **MongoDB sink** for document storage
- **Web interfaces** for monitoring and management
- **Docker orchestration** for easy deployment

## 📋 Services Included

| Service | Port | Description | Interface |
|---------|------|-------------|-----------|
| MySQL | 33600 | Source database | CLI/Tools |
| MongoDB | 27017 | Target database | Mongo Express |
| Kafka | 9092, 9094 | Message broker | Control Center |
| Kafka Connect | 8083 | Connector runtime | REST API |
| Control Center | 9021 | Kafka management | Web UI |
| Mongo Express | 8085 | MongoDB admin | Web UI |

## 🛠️ Setup and Usage

### 1. Start the environment

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f kafka-connect
```

### 2. Create and populate MySQL database

#### Access MySQL
```bash
# Connect to MySQL container
docker-compose exec mysql mysql -u root -p
# Password: root
```

#### Create database and table
```sql
USE kafkadb;

-- Create the categories table
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO categories (name, description) VALUES 
('Electronics', 'Electronic devices and gadgets'),
('Automotive', 'Cars, motorcycles and automotive parts'),
('Musical Instruments', 'Guitars, pianos and other instruments'),
('Books', 'Fiction, non-fiction and educational books'),
('Sports', 'Sports equipment and accessories');

-- Verify data
SELECT * FROM categories;
```

### 3. Configure Kafka Connectors

#### Option A: Using Control Center UI

1. **Access Control Center**: http://localhost:9021
2. **Navigate to**: Clusters → Connect → connect-default
3. **Upload connector configs**: `mysql.properties` and `mongodb.properties`

#### Option B: Using REST API

```bash
# Create MySQL source connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mysql-source-connector",
    "config": {
      "connector.class": "io.debezium.connector.mysql.MySqlConnector",
      "tasks.max": "1",
      "database.hostname": "mysql",
      "database.port": "3306",
      "database.user": "root",
      "database.password": "root",
      "database.server.id": "1",
      "database.server.name": "mysql-server",
      "database.include.list": "kafkadb",
      "database.history.kafka.bootstrap.servers": "kafka:9092",
      "database.history.kafka.topic": "mysql_history",
      "include.schema.changes": "true"
    }
  }'

# Create MongoDB sink connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mongodb-sink-connector",
    "config": {
      "connector.class": "com.mongodb.kafka.connect.MongoSinkConnector",
      "tasks.max": "1",
      "topics": "mysql-server.kafkadb.categories",
      "connection.uri": "mongodb://root:root@mongodb:27017",
      "database": "kafkadb",
      "collection": "categories",
      "transforms": "extractValue",
      "transforms.extractValue.type": "org.apache.kafka.connect.transforms.ExtractField$Value",
      "transforms.extractValue.field": "after"
    }
  }'
```

### 4. Verify data replication

#### Check Kafka topics
```bash
# List topics
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# View messages in MySQL topic
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic mysql-server.kafkadb.categories \
  --from-beginning
```

#### Check MongoDB data
1. **Access Mongo Express**: http://localhost:8085
   - Username: `root`
   - Password: `root`
2. **Navigate to**: kafkadb → categories collection

### 5. Test real-time replication

```sql
-- In MySQL, add more data
USE kafkadb;

INSERT INTO categories (name, description) VALUES 
('Home & Garden', 'Furniture, tools and garden supplies');

UPDATE categories SET description = 'Updated description' WHERE id = 1;

DELETE FROM categories WHERE id = 5;
```

Check MongoDB to see changes replicated in real-time!

## 🔍 Monitoring and Management

### Web Interfaces

- **Kafka Control Center**: http://localhost:9021
  - Monitor connectors, topics, and consumer lag
  - View message flow and throughput
  - Manage connector configurations

- **Mongo Express**: http://localhost:8085
  - Browse MongoDB collections
  - View replicated data
  - Query and analyze documents

### REST API Endpoints

```bash
# Check connector status
curl http://localhost:8083/connectors/mysql-source-connector/status

# List all connectors
curl http://localhost:8083/connectors

# Restart a connector
curl -X POST http://localhost:8083/connectors/mysql-source-connector/restart

# Delete a connector
curl -X DELETE http://localhost:8083/connectors/mysql-source-connector
```

### Useful Commands

```bash
# View connector logs
docker-compose logs -f kafka-connect

# Check Kafka Connect worker status
curl http://localhost:8083/

# Monitor MySQL binary logs
docker-compose exec mysql mysql -u root -p -e "SHOW BINARY LOGS;"

# Check MongoDB collections
docker-compose exec mongodb mongosh -u root -p root --eval "db.getMongo().getDBNames()"
```

## 🚨 Troubleshooting

### Common Issues

#### Connector fails to start
```bash
# Check connector status
curl http://localhost:8083/connectors/mysql-source-connector/status

# View detailed error logs
docker-compose logs kafka-connect | grep ERROR
```

#### No data in MongoDB
1. Verify MySQL binary logging is enabled
2. Check if topics are created: `docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list`
3. Ensure transforms are correctly configured in sink connector

#### Permission denied errors
```bash
# Reset MySQL permissions
docker-compose exec mysql mysql -u root -p -e "
  GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
  FLUSH PRIVILEGES;
"
```

### Performance Tuning

For high-throughput scenarios:

```json
{
  "max.batch.size": "2048",
  "batch.size": "1000",
  "linger.ms": "10",
  "buffer.memory": "67108864"
}
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
