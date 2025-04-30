const Kafka = require('node-rdkafka');

const consumer = new Kafka.KafkaConsumer({
  'bootstrap.servers': 'kafka:9092', // Aligns with the producer
  'group.id': 'nodeapp-group',
  'auto.offset.reset': 'earliest',
  'enable.auto.commit': false, // Better control over message acknowledgment
});

consumer.connect();

consumer.on('ready', () => {
  console.log('✅ Consumer connected and subscribing to topic...');
  consumer.subscribe(['testKafka']);
  consumer.consume();
});

consumer.on('data', (msg) => {
  try {
    const messageValue = msg.value ? msg.value.toString() : null;
    console.log(`📩 Message received: ${messageValue} | Topic: ${msg.topic} | Partition: ${msg.partition} | Offset: ${msg.offset}`);
    
    consumer.commitMessage(msg); // Manually acknowledge message processing
  } catch (err) {
    console.error('❌ Error processing message:', err);
  }
});

consumer.on('event.error', (err) => {
  console.error('❌ Consumer error:', err);
});

process.on('SIGINT', () => {
  console.log('🔌 Disconnecting consumer...');
  consumer.disconnect(() => {
    console.log('🚪 Consumer successfully disconnected.');
    process.exit(0);
  });
});
