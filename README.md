# Apache Kafka Examples & Integrations

This repository contains comprehensive examples and implementations for Apache Kafka, a distributed event streaming platform used for building real-time data pipelines and streaming applications.

## 🏗️ Project Structure

```
apache-kafka/
├── kafka-node-producer-consumer/    # Node.js Producer & Consumer examples
├── kafka-connectors/                # MySQL to MongoDB CDC pipeline
├── Makefile                         # Common commands and automation
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

## 📁 Projects Overview

### 🚀 kafka-node-producer-consumer

**Node.js implementation** of Kafka producers and consumers with enterprise-grade features:

- **Robust Producer** with delivery reports and error handling
- **Resilient Consumer** with reconnection strategy and manual commit
- **External configuration** via environment variables
- **Docker Compose** with health checks and Kafka UI
- **NPM Scripts** for development and production

**Key Features:**
- ✅ Graceful shutdown handling
- ✅ Automatic reconnection with exponential backoff
- ✅ Health monitoring and statistics
- ✅ Configurable logging levels
- ✅ Multiple producer implementations

[📖 View Documentation →](kafka-node-producer-consumer/readme.md)

### 🔄 kafka-connectors

**Change Data Capture (CDC) pipeline** from MySQL to MongoDB using Kafka Connect:

- **Debezium MySQL Source** for real-time change capture
- **MongoDB Sink Connector** for document storage
- **Automatic schema detection** and evolution
- **Web interfaces** for monitoring and management
- **Docker orchestration** for easy deployment

**Key Features:**
- ✅ Real-time data replication
- ✅ Schema evolution support
- ✅ Multiple database tables
- ✅ Web-based monitoring
- ✅ REST API management

[📖 View Documentation →](kafka-connectors/README.md)

## 🛠️ Technologies Used

- **Apache Kafka** - Distributed event streaming
- **Node.js** - JavaScript runtime for producers/consumers
- **Docker & Docker Compose** - Containerization and orchestration
- **Confluent Platform** - Enterprise Kafka distribution
- **MySQL** - Source database for CDC
- **MongoDB** - Target database for CDC
- **Kafka Connect** - Connector framework
- **Debezium** - Change data capture platform

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose**
- **Make** (optional, for using Makefile commands)
- **Node.js 18+** (optional, if running outside containers)

### Option 1: Using Makefile (Recommended)

```bash
# View available commands
make help

# Start Node.js Kafka environment
make node-up

# Start Connectors environment
make connectors-up

# Start both environments
make up-all

# Check status
make status

# View logs
make logs-all

# Clean everything
make clean
```

### Option 2: Manual Setup

#### Node.js Producer/Consumer

```bash
cd kafka-node-producer-consumer
docker-compose up -d

# Run producer
docker-compose exec app npm run producer

# Run consumer (in another terminal)
docker-compose exec app npm run consumer
```

#### Kafka Connectors

```bash
cd kafka-connectors
docker-compose up -d

# Setup MySQL database
make connectors-setup-mysql

# Access web interfaces
# Control Center: http://localhost:9021
# Mongo Express: http://localhost:8085
```

## 🖥️ Web Interfaces

After starting the environments, access these interfaces:

| Interface | URL | Purpose | Project |
|-----------|-----|---------|---------|
| **Kafka UI** | http://localhost:8080 | Modern Kafka management | Node.js |
| **Control Center** | http://localhost:9021 | Confluent Kafka management | Both |
| **Mongo Express** | http://localhost:8085 | MongoDB administration | Connectors |

## 📚 Learning Path

### 1. Start with Basics
- Explore `kafka-node-producer-consumer` for fundamental concepts
- Run simple producer/consumer examples
- Understand Kafka topics, partitions, and consumer groups

### 2. Advanced Integration
- Move to `kafka-connectors` for enterprise integration patterns
- Learn about Change Data Capture (CDC)
- Explore real-time data pipelines

### 3. Production Considerations
- Review configuration options and tuning
- Understand monitoring and observability
- Learn about scaling and high availability

## 🔧 Development

### Environment Configuration

Both projects support environment-based configuration:

```bash
# Copy example configurations
cp kafka-node-producer-consumer/.env.example kafka-node-producer-consumer/.env
cp kafka-connectors/.env.example kafka-connectors/.env  # If exists

# Edit configurations as needed
```

### Common Commands

```bash
# Install dependencies (Node.js project)
cd kafka-node-producer-consumer && npm install

# Development mode with auto-reload
cd kafka-node-producer-consumer && npm run dev:producer

# Check container status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Clean up
docker-compose down -v
```

## 🔍 Troubleshooting

### Common Issues

#### Services not starting
```bash
# Check ports are not in use
make status

# Clean up and restart
make clean
make up-all
```

#### Connection errors
```bash
# Check Kafka broker status
docker-compose logs kafka

# Verify network connectivity
docker network ls
```

#### Performance issues
- Review resource allocation in docker-compose.yaml
- Check Docker Desktop resource limits
- Monitor container logs for errors

### Getting Help

1. **Check documentation** in each project directory
2. **Review logs** using `make logs-all` or docker-compose logs
3. **Verify configuration** files and environment variables
4. **Check service status** using `make status`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add documentation for new features
- Update README files when adding functionality
- Test changes in both development and Docker environments

## 📋 Roadmap

- [ ] **Schema Registry** integration examples
- [ ] **Kafka Streams** processing examples
- [ ] **KSQL** query examples
- [ ] **Monitoring** with Prometheus/Grafana
- [ ] **Security** configurations (SSL/SASL)
- [ ] **Multi-cluster** deployment examples
- [ ] **Performance testing** utilities

## 📄 License

This project is licensed under the MIT License - see individual project directories for specific license files.

## 🔗 Useful Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Platform Documentation](https://docs.confluent.io/)
- [Debezium Documentation](https://debezium.io/documentation/)
- [Node.js Kafka Client](https://github.com/Blizzard/node-rdkafka)
- [Kafka Connect Documentation](https://docs.confluent.io/platform/current/connect/index.html)

---

**Made with ❤️ for learning and demonstration purposes**
