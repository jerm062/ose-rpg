
// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(__dirname + '/public'));
server.listen(process.env.PORT || 3000, () => {
  console.log('OSE RPG running');
});
