const Kafka = require("node-rdkafka");
const { config, validateConfig } = require("./config");

// Validate configurations on initialization
try {
  validateConfig();
} catch (error) {
  console.error("❌ Configuration error:", error.message);
  process.exit(1);
}

// Creates a Kafka Producer with improved configuration
function createProducer() {
  return new Kafka.Producer({
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
}

// Publishes a message to Kafka with improved error handling
function publishMessage(producer, topic, message, key) {
  return new Promise((resolve, reject) => {
    if (config.app.logLevel === 'debug') {
      console.log("📤 Attempting to send message...");
    }

    try {
      if (config.app.logLevel === 'debug') {
        console.log("➡️ Calling produce...");
      }
      
      producer.produce(
        topic,
        null, // Partition (null = automatic choice for better distribution)
        Buffer.from(message), // Message
        key ? Buffer.from(key) : null, // Message key
        Date.now(), // Timestamp
        (err, offset) => {
          if (err) {
            reject(new Error(`Failed to produce message: ${err.message}`));
          } else {
            if (config.app.logLevel === 'debug') {
              console.log("✅ Message queued successfully!");
            }
            resolve(offset);
          }
        }
      );
      
    } catch (err) {
      reject(new Error(`Error producing message: ${err.message}`));
    }
  });
}

// Starts the producer and publishes messages
async function main() {
  let producer;
  let pollInterval;
  
  try {
    producer = createProducer();
    
    // Connection timeout
    const connectTimeout = setTimeout(() => {
      console.error("❌ Connection timeout");
      process.exit(1);
    }, 30000);

    producer.connect();

    // Keeps the poll active to process events
    pollInterval = setInterval(() => {
      try {
        producer.poll();
      } catch (err) {
        console.error("❌ Error during polling:", err);
      }
    }, 100);

    // Properly captures delivery events
    producer.on("delivery-report", (err, report) => {
      if (err) {
        console.error("❌ Error delivering message:", err);
      } else {
        if (config.app.logLevel === 'debug') {
          console.log(`📩 Message delivered - Topic: ${report.topic}, Partition: ${report.partition}, Offset: ${report.offset}`);
        } else {
          console.log(`✅ Message delivered successfully`);
        }
      }
    });

    producer.on("ready", async () => {
      clearTimeout(connectTimeout);
      console.log("✅ Producer connected to Kafka!");
      console.log(`📍 Connected to: ${config.kafka.brokers}`);
      console.log(`📤 Publishing to topic: ${config.kafka.topic}`);

      try {
        // Send multiple messages for demonstration
        const messages = [
          { message: "User account created", key: "user-event" },
          { message: "Payment processed", key: "payment-event" },
          { message: "Order shipped", key: "order-event" },
          { message: JSON.stringify({ 
            event: "transfer", 
            amount: 100, 
            from: "account1", 
            to: "account2",
            timestamp: new Date().toISOString()
          }), key: "transfer-event" }
        ];

        console.log(`📦 Sending ${messages.length} messages...`);
        
        for (let i = 0; i < messages.length; i++) {
          const { message, key } = messages[i];
          
          try {
            console.log(`${i + 1}. Publishing: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
            await publishMessage(producer, config.kafka.topic, message, key);
            
            // Small delay between messages
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (err) {
            console.error(`❌ Failed to publish message ${i + 1}:`, err.message);
          }
        }

        console.log("✅ All messages published");
        
      } catch (err) {
        console.error("❌ Error in message publishing:", err.message);
      }

      // Waits for all messages to be sent before disconnecting
      producer.flush(5000, (err) => {
        if (err) {
          console.error("❌ Error finalizing message sending:", err);
        } else {
          console.log("🚀 All messages flushed successfully");
        }
        
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        
        producer.disconnect((disconnectErr) => {
          if (disconnectErr) {
            console.error("❌ Error disconnecting:", disconnectErr);
            process.exit(1);
          } else {
            console.log("🔌 Producer disconnected successfully");
            process.exit(0);
          }
        });
      });
    });

    producer.on("event.error", (err) => {
      console.error("❌ Producer error:", err);
      
      // Cleanup on error
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      
      process.exit(1);
    });

    producer.on("event.log", (log) => {
      if (config.app.logLevel === 'debug') {
        console.log("📝 Producer log:", log);
      }
    });

  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    
    if (producer) {
      try {
        producer.disconnect();
      } catch (disconnectError) {
        console.error("❌ Error during cleanup:", disconnectError);
      }
    }
    
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

console.log("🚀 Starting advanced Kafka producer...");
main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
