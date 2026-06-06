const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'spokn-backend' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

require('./socket/signaling')(io);

// API Routes
app.use('/api/demo', require('./routes/demo'));

server.listen(port, () => {
  console.log(`Spokn backend running on http://localhost:${port}`);
});
  

