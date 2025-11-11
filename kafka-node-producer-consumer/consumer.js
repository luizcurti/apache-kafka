const Kafka = require('node-rdkafka');
const { config, validateConfig } = require("./config");

// Validate configurations on initialization
try {
  validateConfig();
} catch (error) {
  console.error("❌ Configuration error:", error.message);
  process.exit(1);
}

// Message tracking counter
let messagesProcessed = 0;
let lastHeartbeat = Date.now();

const consumer = new Kafka.KafkaConsumer({
  'bootstrap.servers': config.kafka.brokers,
  'client.id': config.kafka.clientId,
  'group.id': config.kafka.groupId,
  'auto.offset.reset': config.consumer.autoOffsetReset,
  'enable.auto.commit': config.consumer.enableAutoCommit,
  'session.timeout.ms': config.consumer.sessionTimeout,
  'heartbeat.interval.ms': config.consumer.heartbeatInterval,
  'max.poll.records': config.consumer.maxPollRecords,
}, {});

let isConnected = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 5;

consumer.connect();

consumer.on('ready', () => {
  console.log('✅ Consumer connected and subscribing to topic...');
  console.log(`📍 Connected to: ${config.kafka.brokers}`);
  console.log(`📥 Subscribing to topic: ${config.kafka.topic}`);
  console.log(`👥 Consumer group: ${config.kafka.groupId}`);
  
  isConnected = true;
  reconnectAttempts = 0;
  
  consumer.subscribe([config.kafka.topic]);
  consumer.consume();
  
  // Health check heartbeat
  setInterval(() => {
    lastHeartbeat = Date.now();
    if (config.app.logLevel === 'debug') {
      console.log(`💓 Heartbeat - Messages processed: ${messagesProcessed}`);
    }
  }, 30000);
});

consumer.on('data', (msg) => {
  try {
    const messageValue = msg.value ? msg.value.toString() : null;
    const messageKey = msg.key ? msg.key.toString() : null;
    
    if (!messageValue) {
      console.warn('⚠️ Received empty message');
      consumer.commitMessage(msg);
      return;
    }

    console.log(`📩 Message received: ${messageValue}`);
    console.log(`   📍 Details: Topic: ${msg.topic} | Partition: ${msg.partition} | Offset: ${msg.offset} | Key: ${messageKey || 'null'}`);
    
    // Simulate message processing
    processMessage(messageValue, messageKey);
    
    // Manually acknowledge message processing
    consumer.commitMessage(msg);
    messagesProcessed++;
    
    if (config.app.logLevel === 'debug') {
      console.log(`✅ Message committed successfully. Total processed: ${messagesProcessed}`);
    }
    
  } catch (err) {
    console.error('❌ Error processing message:', err);
    console.error('📄 Message details:', {
      topic: msg.topic,
      partition: msg.partition,
      offset: msg.offset,
      key: msg.key ? msg.key.toString() : null,
      value: msg.value ? msg.value.toString() : null
    });
    
    // In case of error, still commit to avoid reprocessing
    // In production, you could send to a DLQ (Dead Letter Queue)
    consumer.commitMessage(msg);
  }
});

consumer.on('event.error', (err) => {
  console.error('❌ Consumer error:', err);
  isConnected = false;
  
  // Attempt to reconnect in case of connection error
  if ((err.code === -195 || err.code === -185 || err.code === -1) && 
      reconnectAttempts < maxReconnectAttempts) {
    
    reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
    
    setTimeout(() => {
      try {
        consumer.disconnect(() => {
          setTimeout(() => {
            consumer.connect();
          }, 2000);
        });
      } catch (disconnectErr) {
        console.error('❌ Error during disconnect:', disconnectErr);
      }
    }, Math.pow(2, reconnectAttempts) * 1000); // Exponential backoff
  } else if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('💀 Max reconnect attempts reached. Exiting...');
    process.exit(1);
  }
});

consumer.on('event.log', (log) => {
  if (config.app.logLevel === 'debug') {
    console.log("📝 Consumer log:", log);
  }
});

consumer.on('disconnected', () => {
  console.log('🔌 Consumer disconnected');
  isConnected = false;
});

// Function to process message (customize as needed)
function processMessage(messageValue, messageKey) {
  try {
    // Add your processing logic here
    // For example: parse JSON, validation, transformation, etc.
    
    if (config.app.logLevel === 'debug') {
      console.log(`🔄 Processing message with key: ${messageKey}`);
    }
    
    // Simulate processing
    // const data = JSON.parse(messageValue);
    // await saveToDatabase(data);
    
  } catch (err) {
    console.error('❌ Error in message processing logic:', err);
    throw err; // Re-throw so it can be captured in the main handler
  }
}

// Graceful shutdown
function gracefulShutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  console.log(`📊 Final Stats: ${messagesProcessed} messages processed`);
  
  if (isConnected) {
    consumer.disconnect((err) => {
      if (err) {
        console.error('❌ Error during disconnect:', err);
      } else {
        console.log('🚪 Consumer successfully disconnected');
      }
      process.exit(err ? 1 : 0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Health monitoring
process.on('uncaughtException', (err) => {
  console.error('💀 Uncaught Exception:', err);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💀 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

console.log("🚀 Starting Kafka consumer...");
