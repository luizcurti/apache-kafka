const Kafka = require("node-rdkafka");
const { config, validateConfig } = require("./config");

// Validate configurations on initialization
try {
  validateConfig();
} catch (error) {
  console.error("❌ Configuration error:", error.message);
  process.exit(1);
}

const producer = new Kafka.Producer({
  "metadata.broker.list": config.kafka.brokers,
  "client.id": config.kafka.clientId,
  "acks": config.producer.acks,
  "enable.idempotence": config.producer.enableIdempotence,
  "retries": config.producer.retries,
  "batch.size": config.producer.batchSize,
  "linger.ms": config.producer.lingerMs,
  "request.timeout.ms": config.producer.requestTimeoutMs,
  "dr_cb": true, // Enable delivery reports
});

// Message tracking counter
let messagesSent = 0;
let messagesDelivered = 0;

producer.on("ready", () => {
  console.log("✅ Producer connected to Kafka!");
  console.log(`📍 Connected to: ${config.kafka.brokers}`);
  console.log(`📤 Sending messages to topic: ${config.kafka.topic}`);

  // Send messages
  const totalMessages = parseInt(process.env.MESSAGE_COUNT) || 50;
  
  for (let i = 1; i <= totalMessages; i++) {
    const message = `Message ${i} - ${new Date().toISOString()}`;
    
    try {
      producer.produce(
        config.kafka.topic, // Topic name
        null, // Partition (null for automatic balancing)
        Buffer.from(message), // Message converted to Buffer
        `key-${i}`, // Key (helps with partitioning)
        Date.now(), // Timestamp
        (err, offset) => {
          if (err) {
            console.error(`❌ Failed to send message ${i}:`, err);
          }
        }
      );

      messagesSent++;
      console.log(`📩 Sent: ${message}`);
    } catch (error) {
      console.error(`❌ Error sending message ${i}:`, error);
    }
  }

  producer.flush(5000, (err) => {
    if (err) {
      console.error("❌ Error flushing messages:", err);
    } else {
      console.log("🚀 All messages have been flushed!");
    }
    
    // Wait a bit for delivery reports before disconnecting
    setTimeout(() => {
      producer.disconnect((err) => {
        if (err) {
          console.error("❌ Error disconnecting:", err);
        } else {
          console.log(`📊 Final Stats: ${messagesSent} sent, ${messagesDelivered} delivered`);
          console.log("🔌 Producer disconnected successfully");
        }
        process.exit(err ? 1 : 0);
      });
    }, 1000);
  });
});

// Handle delivery reports
producer.on("delivery-report", (err, report) => {
  if (err) {
    console.error("❌ Delivery failed:", err);
  } else {
    messagesDelivered++;
    if (config.app.logLevel === 'debug') {
      console.log(`✅ Message delivered - Topic: ${report.topic}, Partition: ${report.partition}, Offset: ${report.offset}`);
    }
  }
});

producer.on("event.error", (err) => {
  console.error("❌ Producer error:", err);
  
  // Attempt to reconnect in case of connection error
  if (err.code === -195 || err.code === -185) { // Network error codes
    console.log("🔄 Attempting to reconnect...");
    setTimeout(() => {
      producer.connect();
    }, 5000);
  }
});

producer.on("event.log", (log) => {
  if (config.app.logLevel === 'debug') {
    console.log("📝 Producer log:", log);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  
  producer.flush(1000, (err) => {
    producer.disconnect((err) => {
      console.log('🚪 Producer disconnected');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  
  producer.flush(1000, (err) => {
    producer.disconnect((err) => {
      console.log('🚪 Producer disconnected');
      process.exit(0);
    });
  });
});

console.log("🚀 Starting Kafka producer...");
producer.connect();
