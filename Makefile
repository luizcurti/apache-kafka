# Kafka Project Makefile
# Provides common commands for both node-producer-consumer and kafka-connectors projects

.PHONY: help up down logs clean status restart

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Node Producer-Consumer commands
node-up: ## Start Node.js Kafka producer/consumer environment
	@echo "🚀 Starting Node.js Kafka environment..."
	cd kafka-node-producer-consumer && docker-compose up -d
	@echo "✅ Environment started. Access Kafka UI at http://localhost:8080"

node-down: ## Stop Node.js Kafka producer/consumer environment
	@echo "🛑 Stopping Node.js Kafka environment..."
	cd kafka-node-producer-consumer && docker-compose down

node-logs: ## Show logs for Node.js environment
	cd kafka-node-producer-consumer && docker-compose logs -f

node-producer: ## Run producer inside container
	cd kafka-node-producer-consumer && docker-compose exec app npm run producer

node-consumer: ## Run consumer inside container
	cd kafka-node-producer-consumer && docker-compose exec app npm run consumer

node-producer2: ## Run alternative producer inside container
	cd kafka-node-producer-consumer && docker-compose exec app npm run producer2

node-shell: ## Access Node.js container shell
	cd kafka-node-producer-consumer && docker-compose exec app /bin/bash

# Kafka Connectors commands
connectors-up: ## Start Kafka Connectors environment (MySQL → MongoDB)
	@echo "🚀 Starting Kafka Connectors environment..."
	cd kafka-connectors && docker-compose up -d
	@echo "✅ Environment started."
	@echo "📊 Control Center: http://localhost:9021"
	@echo "🗄️  Mongo Express: http://localhost:8085"

connectors-down: ## Stop Kafka Connectors environment
	@echo "🛑 Stopping Kafka Connectors environment..."
	cd kafka-connectors && docker-compose down

connectors-logs: ## Show logs for Connectors environment
	cd kafka-connectors && docker-compose logs -f

connectors-setup-mysql: ## Setup MySQL database with sample data
	@echo "🗄️ Setting up MySQL database..."
	cd kafka-connectors && docker-compose exec mysql mysql -u root -proot kafkadb < scripts/setup-mysql.sql
	@echo "✅ MySQL database setup complete"

connectors-mysql: ## Access MySQL shell
	cd kafka-connectors && docker-compose exec mysql mysql -u root -proot kafkadb

connectors-mongo: ## Access MongoDB shell
	cd kafka-connectors && docker-compose exec mongodb mongosh -u root -p root kafkadb

# Combined commands
up-all: ## Start both environments
	@echo "🚀 Starting all Kafka environments..."
	make node-up
	make connectors-up

down-all: ## Stop both environments
	@echo "🛑 Stopping all Kafka environments..."
	make node-down
	make connectors-down

status: ## Show status of all containers
	@echo "📊 Node.js Environment:"
	@cd kafka-node-producer-consumer && docker-compose ps 2>/dev/null || echo "Not running"
	@echo ""
	@echo "📊 Connectors Environment:"
	@cd kafka-connectors && docker-compose ps 2>/dev/null || echo "Not running"

logs-all: ## Show logs from all environments
	@echo "📋 All environment logs:"
	@cd kafka-node-producer-consumer && docker-compose logs --tail=50 2>/dev/null &
	@cd kafka-connectors && docker-compose logs --tail=50 2>/dev/null &
	@wait

clean: ## Clean up all containers, networks, and volumes
	@echo "🧹 Cleaning up all Kafka environments..."
	@cd kafka-node-producer-consumer && docker-compose down -v --remove-orphans 2>/dev/null || true
	@cd kafka-connectors && docker-compose down -v --remove-orphans 2>/dev/null || true
	@docker system prune -f
	@echo "✅ Cleanup complete"

restart-all: ## Restart both environments
	make down-all
	make up-all

# Development commands
install: ## Install Node.js dependencies
	@echo "📦 Installing Node.js dependencies..."
	cd kafka-node-producer-consumer && npm install
	@echo "✅ Dependencies installed"

test-connection: ## Test Kafka connectivity
	@echo "🔗 Testing Kafka connectivity..."
	cd kafka-node-producer-consumer && docker-compose exec app npm run producer
	@echo "✅ Connection test complete"

# Connector management
create-mysql-connector: ## Create MySQL source connector
	@echo "🔌 Creating MySQL source connector..."
	curl -X POST http://localhost:8083/connectors \
		-H "Content-Type: application/json" \
		-d @kafka-connectors/connectors/mysql-connector.json

create-mongo-connector: ## Create MongoDB sink connector
	@echo "🔌 Creating MongoDB sink connector..."
	curl -X POST http://localhost:8083/connectors \
		-H "Content-Type: application/json" \
		-d @kafka-connectors/connectors/mongodb-connector.json

list-connectors: ## List all Kafka connectors
	@echo "📋 Active connectors:"
	@curl -s http://localhost:8083/connectors | jq '.'

connector-status: ## Show status of all connectors
	@echo "📊 Connector status:"
	@for connector in $$(curl -s http://localhost:8083/connectors | jq -r '.[]'); do \
		echo "Connector: $$connector"; \
		curl -s http://localhost:8083/connectors/$$connector/status | jq '.'; \
		echo ""; \
	done

# Monitoring
monitor: ## Open monitoring interfaces
	@echo "🖥️ Opening monitoring interfaces..."
	@open http://localhost:8080 || echo "Kafka UI: http://localhost:8080"
	@open http://localhost:9021 || echo "Control Center: http://localhost:9021"
	@open http://localhost:8085 || echo "Mongo Express: http://localhost:8085"

# Documentation
docs: ## Generate documentation
	@echo "📚 Available documentation:"
	@echo "📄 Node.js Producer/Consumer: kafka-node-producer-consumer/readme.md"
	@echo "📄 Kafka Connectors: kafka-connectors/README.md"
	@echo "📄 Main Project: README.md"

check-env: ## Check environment setup
	@echo "🔍 Checking environment setup..."
	@echo "Docker version:"
	@docker --version
	@echo ""
	@echo "Docker Compose version:"
	@docker-compose --version
	@echo ""
	@echo "Node.js version (if installed locally):"
	@node --version 2>/dev/null || echo "Node.js not installed locally (OK if using Docker)"
	@echo ""
	@echo "✅ Environment check complete"