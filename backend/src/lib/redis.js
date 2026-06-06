const redis = require('redis');

const client = redis.createClient({
  socket: {
    reconnectStrategy: false // Stop retrying indefinitely if Redis is offline
  }
});

client.on('error', () => {
  // Ignored loosely here to prevent ECONNREFUSED terminal spam
});

async function connectRedis() {
  if (!client.isOpen) {
    try {
      await client.connect();
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis. Make sure Docker Desktop and your Redis container are running.', error.message);
    }
  }
  return client;
}

connectRedis();

module.exports = client;
