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
  const totalMessages = parseInt(process.env.MESSAGE_COUNT, 10) || 50;
  
  for (let i = 1; i <= totalMessages; i++) {
    const message = `Message ${i} - ${new Date().toISOString()}`;
    
    try {
      producer.produce(
        config.kafka.topic, // Topic name
        null, // Partition (null for automatic balancing)
        Buffer.from(message), // Message converted to Buffer
        `key-${i}`, // Key (helps with partitioning)
        Date.now() // Timestamp
        // Delivery errors are reported via the 'delivery-report' event below
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
  // This is a one-shot producer (connect → send → flush → exit).
  // Fatal errors are surfaced here; the flush/disconnect callbacks will handle exit codes.
});

producer.on("event.log", (log) => {
  if (config.app.logLevel === 'debug') {
    console.log("📝 Producer log:", log);
  }
});

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  producer.flush(3000, (flushErr) => {
    if (flushErr) {
      console.error('❌ Error flushing messages during shutdown:', flushErr);
    }
    producer.disconnect((disconnectErr) => {
      if (disconnectErr) {
        console.error('❌ Error disconnecting during shutdown:', disconnectErr);
      } else {
        console.log('🚪 Producer disconnected');
      }
      process.exit(flushErr || disconnectErr ? 1 : 0);
    });
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

console.log("🚀 Starting Kafka producer...");
producer.connect();
