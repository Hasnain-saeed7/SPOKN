const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
    reconnectStrategy: false
  }
});

client.on('error', () => {});

async function connectRedis() {
  if (!client.isOpen) {
    try {
      await client.connect();
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis.', error.message);
    }
  }
  return client;
}

connectRedis();

module.exports = client;