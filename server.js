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
const LOG_FILE = path.join(__dirname, 'campaign_log.txt');
const MAP_FILE = path.join(__dirname, 'map_data.json');

let campaignLog = [];
let maps = {};
let sharedMap = null;
let currentMap = null;

let savedCharacters = {};
let sharedText = "Welcome to the campaign.";
// Track which player sockets map to which names and ready status
const playerNames = {};
const readyState = {};

// Load campaign log
if (fs.existsSync(LOG_FILE)) {
  try {
    campaignLog = fs.readFileSync(LOG_FILE, 'utf8').split(/\r?\n/).filter(Boolean);
  } catch (err) {
    console.error('Error reading log file:', err);
  }
}

// Load map data (supports multiple maps)
if (fs.existsSync(MAP_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(MAP_FILE));
    if (Array.isArray(raw)) {
      maps.default = raw;
      sharedMap = 'default';
    } else {
      maps = raw.maps || {};
      sharedMap = raw.sharedMap || Object.keys(maps)[0] || null;
    }
  } catch (err) {
    console.error('Error reading map file:', err);
  }
}
currentMap = sharedMap;

function saveMaps() {
  fs.writeFile(
    MAP_FILE,
    JSON.stringify({ maps, sharedMap }, null, 2),
    () => {}
  );
}

// Load saved characters from file
if (fs.existsSync(CHAR_FILE)) {
  try {
    savedCharacters = JSON.parse(fs.readFileSync(CHAR_FILE));
  } catch (err) {
    console.error("Error reading character file:", err);
  }
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/organized_tiles', express.static(path.join(__dirname, 'organized_tiles')));
app.get('/organized_tileset.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'organized_tileset.json'));
});

// Redirect root to player.html for Render or localhost
app.get('/', (req, res) => {
  res.redirect('/player.html');
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("registerPlayer", (name) => {
    playerNames[socket.id] = name;
    if (!Object.prototype.hasOwnProperty.call(readyState, name)) {
      readyState[name] = false;
    }
    socket.emit("readyList", readyState);
    io.emit("readyList", readyState);
  });

  socket.on("playerReady", (state) => {
    const name = playerNames[socket.id];
    if (name) {
      readyState[name] = !!state;
      io.emit("readyList", readyState);
    }
  });

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
    socket.emit("characterLoaded", charData);
  });

  socket.on("deleteCharacter", (name) => {
    delete savedCharacters[name];
    fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {});
  });

  socket.on("loadAllCharacters", () => {
    socket.emit("allCharacters", savedCharacters);
  });

  socket.on("playerMessage", ({ name, message }) => {
    // Consume items prefixed with # and subtract gold when $amount is found
    const char = savedCharacters[name];
    if (char) {
      const itemRegex = /#([\w ]+)/g;
      let match;
      while ((match = itemRegex.exec(message))) {
        const itemName = match[1].trim().toLowerCase();
        const idx = (char.inventory || []).findIndex(
          (it) => it.toLowerCase() === itemName
        );
        if (idx !== -1) {
          char.inventory.splice(idx, 1);
        }
      }

      const goldRegex = /\$(\d+)/g;
      while ((match = goldRegex.exec(message))) {
        const amt = parseInt(match[1], 10);
        if (!isNaN(amt)) {
          char.gold = Math.max(0, (char.gold || 0) - amt);
        }
      }
      fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {});
    }

    const entry = `[Player] ${name}: ${message}`;
    campaignLog.push(entry);
    fs.appendFile(LOG_FILE, entry + "\n", () => {});
    io.emit("logUpdate", entry);
  });

  socket.on("dmMessage", (message) => {
    const entry = `[DM]: ${message}`;
    campaignLog.push(entry);
    fs.appendFile(LOG_FILE, entry + "\n", () => {});
    io.emit("logUpdate", entry);
  });

  socket.on("getCampaignLog", () => {
    socket.emit("campaignLog", campaignLog);
  });

  socket.on("getMap", () => {
    if (sharedMap && maps[sharedMap]) {
      socket.emit("mapData", maps[sharedMap]);
    }
  });

  socket.on("getMapList", () => {
    socket.emit("mapList", Object.keys(maps));
  });

  socket.on("loadMap", (name) => {
    if (maps[name]) {
      currentMap = name;
      socket.emit("mapData", maps[name]);
    }
  });

  socket.on("saveMap", ({ name, data }) => {
    maps[name] = data;
    currentMap = name;
    if (!sharedMap) sharedMap = name;
    saveMaps();
  });

  socket.on("deleteMap", (name) => {
    if (maps[name]) {
      delete maps[name];
      if (sharedMap === name) sharedMap = Object.keys(maps)[0] || null;
      if (currentMap === name) currentMap = sharedMap;
      saveMaps();
    }
  });

  socket.on("shareMap", (name) => {
    if (maps[name]) {
      sharedMap = name;
      saveMaps();
      io.emit("mapData", maps[name]);
    }
  });

  socket.on("updateMapCell", ({ x, y, value }) => {
    const map = maps[currentMap];
    if (map && map[y] && typeof map[y][x] !== "undefined") {
      map[y][x] = value;
      saveMaps();
      if (currentMap === sharedMap) io.emit("mapData", map);
      else socket.emit("mapData", map);
    }
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
    const name = playerNames[socket.id];
    if (name) {
      delete playerNames[socket.id];
      delete readyState[name];
      io.emit("readyList", readyState);
    }
  });
});

server.listen(PORT, () => {
  console.log(`OSE RPG server running on port ${PORT}`);
});
