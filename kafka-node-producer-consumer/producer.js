const Kafka = require("node-rdkafka");

const producer = new Kafka.Producer({
  "metadata.broker.list": "kafka:9092",
  "acks": "all",
  "enable.idempotence": true,
});

producer.on("ready", () => {
  console.log("✅ Producer connected to Kafka!");

  // Send messages
  const x = 50;
  for (let i = 1; i <= x; i++) {
    const message = `Message ${i}`;
    
    producer.produce(
      "testKafka", // Topic name
      null, // Partition (null for automatic balancing)
      Buffer.from(message), // Message converted to Buffer
      null, // Key (optional)
      Date.now() // Timestamp
    );

    console.log(`📩 Sent: ${message}`);
  }

  producer.flush(5000, () => {
    console.log("🚀 All messages have been sent!");
    producer.disconnect();
  });
});

producer.on("event.error", (err) => {
  console.error("❌ Producer error:", err);
});

producer.connect();
