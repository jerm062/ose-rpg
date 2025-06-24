
// server.js (Socket.IO + Express + character save/load to file)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));

// Add root route to help Render detect an open port
app.get('/', (req, res) => {
  res.send('OSE RPG server is running.');
});

const CHAR_FILE = path.join(__dirname, 'player_data.json');
let savedCharacters = {};

// Load saved characters on startup
if (fs.existsSync(CHAR_FILE)) {
  try {
    savedCharacters = JSON.parse(fs.readFileSync(CHAR_FILE));
  } catch (err) {
    console.error("Error reading character save file:", err);
    savedCharacters = {};
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('loadCharacter', (name) => {
    if (savedCharacters[name]) {
      socket.emit('characterLoaded', savedCharacters[name]);
    } else {
      socket.emit('characterNotFound');
    }
  });

  socket.on('saveCharacter', (charData) => {
    savedCharacters[charData.name] = charData;
    fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), (err) => {
      if (err) console.error("Error saving character data:", err);
      else console.log(`Character saved: ${charData.name}`);
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`OSE RPG server listening on port ${PORT}`);
});
