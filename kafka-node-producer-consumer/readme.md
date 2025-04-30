### Kafka Node.js Project

## Overview

This project consists of a Node.js application that integrates with Apache Kafka using the node-rdkafka library. It includes a Kafka producer, a Kafka consumer, and Docker configurations for easy setup.

## Project Files

1. Producer (producer.js)

This script creates a Kafka producer that sends messages to a Kafka topic.
Uses node-rdkafka to produce messages.
Connects to Kafka and sends 50 messages to the testKafka topic.
Ensures idempotent production to avoid duplicate messages.
Flushes and disconnects after sending messages.

2. Consumer (consumer.js)

This script creates a Kafka consumer that listens for messages from a Kafka topic.
Connects to Kafka and subscribes to the testKafka topic.
Processes and prints received messages.
Manually commits message offsets for better control.
Handles graceful shutdown on SIGINT.

3. Dockerfile (Dockerfile)

Defines the Node.js application environment.
Uses the node:20 base image.
Installs necessary dependencies including librdkafka.
Copies package.json files and installs Node.js dependencies.
Runs indefinitely for debugging (tail -f /dev/null).

4. Docker Compose (docker-compose.yml)
Defines services for running Kafka and the Node.js app in a containerized environment.
app: The Node.js application container.
zookeeper: Manages Kafka brokers.
kafka: Kafka broker with exposed ports 9092 and 9094.
control-center: Web UI to monitor Kafka.

## How to Set Up and Run

# Pre requisites
Ensure you have:

* Docker and Docker Compose installed.
* Node.js and npm installed (if running outside Docker).

## Running the Application

Build and Start Containers:
* docker-compose up -d --build

Check Running Containers:
* docker ps

Run the Producer:
* docker exec -it node-kafka node producer.js

Run the Consumer:
* docker exec -it node-kafka node consumer.js

Monitor Kafka (Optional): Open Control Center in a browser.

## Stopping the Application

To stop and remove all containers:
* docker-compose down