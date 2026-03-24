require('dotenv').config();

const config = {
  kafka: {
    brokers: process.env.KAFKA_BROKERS || 'kafka:9092',
    groupId: process.env.KAFKA_GROUP_ID || 'nodeapp-group',
    topic: process.env.KAFKA_TOPIC || 'testKafka',
    clientId: process.env.KAFKA_CLIENT_ID || 'node-kafka-client'
  },
  consumer: {
    autoOffsetReset: process.env.KAFKA_AUTO_OFFSET_RESET || 'earliest',
    enableAutoCommit: process.env.KAFKA_ENABLE_AUTO_COMMIT === 'true',
    sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT, 10) || 30000,
    heartbeatInterval: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL, 10) || 3000,
  },
  producer: {
    acks: process.env.KAFKA_ACKS || 'all',
    enableIdempotence: process.env.KAFKA_ENABLE_IDEMPOTENCE !== 'false',
    retries: parseInt(process.env.KAFKA_RETRIES, 10) || 3,
    batchSize: parseInt(process.env.KAFKA_BATCH_SIZE, 10) || 16384,
    lingerMs: parseInt(process.env.KAFKA_LINGER_MS, 10) || 10,
    requestTimeoutMs: parseInt(process.env.KAFKA_REQUEST_TIMEOUT_MS, 10) || 30000
  },
  app: {
    logLevel: process.env.LOG_LEVEL || 'info',
    environment: process.env.NODE_ENV || 'development'
  }
};

// Required configuration validation
function validateConfig() {
  if (!config.kafka.brokers) {
    throw new Error('KAFKA_BROKERS is required');
  }
  if (!config.kafka.topic) {
    throw new Error('KAFKA_TOPIC is required');
  }
  if (!config.kafka.groupId) {
    throw new Error('KAFKA_GROUP_ID is required');
  }
  if (isNaN(config.consumer.sessionTimeout)) {
    throw new Error('KAFKA_SESSION_TIMEOUT must be a valid number');
  }
  if (isNaN(config.consumer.heartbeatInterval)) {
    throw new Error('KAFKA_HEARTBEAT_INTERVAL must be a valid number');
  }
}

module.exports = { config, validateConfig };