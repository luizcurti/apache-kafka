const Kafka = require("node-rdkafka");

// Creates a Kafka Producer
function createProducer() {
  return new Kafka.Producer({
    "metadata.broker.list": "kafka:9092",
    "acks": "all",
    "enable.idempotence": true,
  });
}

// Publishes a message to Kafka
function publishMessage(producer, topic, message, key) {
  return new Promise((resolve, reject) => {
    console.log("📤 Attempting to send message...");

    try {
      console.log("➡️ Calling produce...");
      producer.produce(
        topic,
        1, // Partition (null = automatic choice)
        Buffer.from(message), // Message
        key ? Buffer.from(key) : null, // Message key
        Date.now()
      );
      console.log("✅ Message sent to Kafka!");
      resolve();
    } catch (err) {
      reject("❌ Error producing message: " + err);
    }
  });
}

// Starts the producer and publishes a message
async function main() {
  const producer = createProducer();
  
  producer.connect();

  // Keeps the poll active to process events
  const pollInterval = setInterval(() => producer.poll(), 100);

  // Properly captures delivery events
  producer.on("delivery-report", (err, report) => {
    if (err) {
      console.error("❌ Error delivering message: ", err);
    } else {
      console.log(`📩 Message delivered - Topic: ${report.topic}, Partition: ${report.partition}, Offset: ${report.offset}`);
    }
  });

  producer.on("ready", async () => {
    console.log("✅ Producer connected to Kafka!");

    try {
      console.log("1 - Before publishMessage");
      await publishMessage(producer, "testKafka", "transferred", "transfer2");
      console.log("✅ 2 - After publishMessage");
    } catch (err) {
      console.error(err);
    }

    // Waits for all messages to be sent before disconnecting
    producer.flush(5000, (err) => {
      if (err) {
        console.error("❌ Error finalizing message sending:", err);
      }
      clearInterval(pollInterval); // Stops polling before disconnecting
      producer.disconnect();
      console.log("🔌 Producer disconnected.");
    });
  });

  producer.on("event.error", (err) => {
    console.error("❌ Producer error:", err);
  });
}

main();
