const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const CHAR_FILE = path.join(__dirname, 'player_data.json');

let savedCharacters = {};
let sharedText = "Welcome to the campaign.";

// Load saved characters from file
if (fs.existsSync(CHAR_FILE)) {
  try {
    savedCharacters = JSON.parse(fs.readFileSync(CHAR_FILE));
  } catch (err) {
    console.error("Error reading character file:", err);
  }
}

app.use(express.static(path.join(__dirname, 'public')));

// Redirect root to player.html for Render or localhost
app.get('/', (req, res) => {
  res.redirect('/player.html');
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("loadCharacter", (name) => {
    if (savedCharacters[name]) {
      socket.emit("characterLoaded", savedCharacters[name]);
    } else {
      socket.emit("characterNotFound");
    }
  });

  socket.on("saveCharacter", (charData) => {
    savedCharacters[charData.name] = charData;
    fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), (err) => {
      if (err) console.error("Save error:", err);
    });
  });

  socket.on("deleteCharacter", (name) => {
    delete savedCharacters[name];
    fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {});
  });

  socket.on("loadAllCharacters", () => {
    socket.emit("allCharacters", savedCharacters);
  });

  socket.on("getSharedText", () => {
    socket.emit("sharedText", sharedText);
  });

  socket.on("updateSharedText", (text) => {
    sharedText = text;
    io.emit("sharedText", sharedText);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`OSE RPG server running on port ${PORT}`);
});