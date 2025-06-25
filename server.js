const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Persist user generated content under the data directory
// The location can be overridden by setting the OSE_RPG_DATA_DIR
// environment variable, allowing saves on a separate disk
const DATA_DIR = process.env.OSE_RPG_DATA_DIR
  ? path.resolve(process.env.OSE_RPG_DATA_DIR)
  : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Sub directories for different types of campaign data
const CHAR_DIR = path.join(DATA_DIR, 'characters');
const MAP_DIR = path.join(DATA_DIR, 'maps');
const CHAT_DIR = path.join(DATA_DIR, 'chat');
const LORE_DIR = path.join(DATA_DIR, 'lore');
[CHAR_DIR, MAP_DIR, CHAT_DIR, LORE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const CHAR_FILE = path.join(CHAR_DIR, 'player_data.json');
const LOG_FILE = path.join(CHAT_DIR, 'campaign_log.txt');
const MAP_FILE = path.join(MAP_DIR, 'map_data.json');
const LORE_FILE = path.join(LORE_DIR, 'lore.json');

let campaignLog = [];
let maps = {};
let sharedMap = null;
let currentMap = null;

let savedCharacters = {};
let lore = {
  characters: [],
  deaths: [],
  events: [],
  locations: [],
  religion: [],
  religionDeath: [],
};
let sharedText = "Welcome to the campaign.";

// Ensure base data files exist
if (!fs.existsSync(CHAR_FILE)) fs.writeFileSync(CHAR_FILE, '{}');
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');
if (!fs.existsSync(MAP_FILE))
  fs.writeFileSync(MAP_FILE, JSON.stringify({ maps: {}, sharedMap: null }, null, 2));
if (!fs.existsSync(LORE_FILE))
  fs.writeFileSync(LORE_FILE, JSON.stringify(lore, null, 2));
// Track which player sockets map to which names and ready status
const playerNames = {};
const readyState = {};
const playerPositions = {};

function loadAll() {
  // Load campaign log
  if (fs.existsSync(LOG_FILE)) {
    try {
      campaignLog = fs
        .readFileSync(LOG_FILE, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean);
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

  // Load saved characters from file
  if (fs.existsSync(CHAR_FILE)) {
    try {
      savedCharacters = JSON.parse(fs.readFileSync(CHAR_FILE));
      Object.values(savedCharacters).forEach((c) => {
        c.inventory = c.inventory || [];
        c.equipped = c.equipped || [];
        c.status = c.status || [];
        c.beersDrank = c.beersDrank || 0;
      });
    } catch (err) {
      console.error('Error reading character file:', err);
    }
  }

  // Load lore data
  if (fs.existsSync(LORE_FILE)) {
    try {
      lore = JSON.parse(fs.readFileSync(LORE_FILE));
      lore.religion = lore.religion || [];
      lore.religionDeath = lore.religionDeath || [];
    } catch (err) {
      console.error('Error reading lore file:', err);
    }
  }
}

loadAll();

function saveMaps() {
  fs.writeFile(
    MAP_FILE,
    JSON.stringify({ maps, sharedMap }, null, 2),
    () => {}
  );
}

function saveLore() {
  fs.writeFile(LORE_FILE, JSON.stringify(lore, null, 2), () => {});
}

function saveAll() {
  fs.writeFileSync(CHAR_FILE, JSON.stringify(savedCharacters, null, 2));
  fs.writeFileSync(MAP_FILE, JSON.stringify({ maps, sharedMap }, null, 2));
  fs.writeFileSync(LOG_FILE, campaignLog.join("\n"));
  fs.writeFileSync(LORE_FILE, JSON.stringify(lore, null, 2));
}

function exportCharacters() {
  Object.entries(savedCharacters).forEach(([name, data]) => {
    const file = path.join(CHAR_DIR, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  });
}

function exportMaps() {
  Object.entries(maps).forEach(([name, data]) => {
    const file = path.join(MAP_DIR, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  });
}

function exportLore() {
  fs.writeFileSync(
    path.join(LORE_DIR, 'characters.json'),
    JSON.stringify(lore.characters, null, 2)
  );
  fs.writeFileSync(
    path.join(LORE_DIR, 'deaths.json'),
    JSON.stringify(lore.deaths, null, 2)
  );
  fs.writeFileSync(
    path.join(LORE_DIR, 'events.json'),
    JSON.stringify(lore.events, null, 2)
  );
  fs.writeFileSync(
    path.join(LORE_DIR, 'locations.json'),
    JSON.stringify(lore.locations, null, 2)
  );
  fs.writeFileSync(
    path.join(LORE_DIR, 'religion.json'),
    JSON.stringify(lore.religion, null, 2)
  );
  fs.writeFileSync(
    path.join(LORE_DIR, 'religion_death.json'),
    JSON.stringify(lore.religionDeath, null, 2)
  );
}

function exportAll() {
  exportCharacters();
  exportMaps();
  exportLore();
  fs.writeFileSync(LOG_FILE, campaignLog.join("\n"));
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use('/organized_tiles', express.static(path.join(__dirname, 'organized_tiles')));
app.get('/organized_tileset.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'organized_tileset.json'));
});

app.get('/icons/list', (req, res) => {
  fs.readdir(path.join(__dirname, 'icons'), (err, files) => {
    if (err) return res.json([]);
    const list = files.filter((f) => f.endsWith('.png'));
    res.json(list);
  });
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
    if (savedCharacters[name] && savedCharacters[name].icon && !playerPositions[name]) {
      playerPositions[name] = { x: 0, y: 0, icon: savedCharacters[name].icon };
    }
    socket.emit("readyList", readyState);
    socket.emit("playerPositions", playerPositions);
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
      const c = savedCharacters[name];
      c.inventory = c.inventory || [];
      c.equipped = c.equipped || [];
      c.status = c.status || [];
      c.beersDrank = c.beersDrank || 0;
      socket.emit("characterLoaded", c);
    } else {
      socket.emit("characterNotFound");
    }
  });

  socket.on("saveCharacter", (charData) => {
    charData.inventory = charData.inventory || [];
    charData.equipped = charData.equipped || [];
    charData.status = charData.status || [];
    charData.beersDrank = charData.beersDrank || 0;
    if (charData.religion) {
      const entry = `${charData.name}: ${charData.religion.type}` +
        (charData.religion.deity ? ` - ${charData.religion.deity}` : "");
      const idx = lore.religion.findIndex((r) => r.startsWith(`${charData.name}:`));
      if (idx !== -1) lore.religion[idx] = entry; else lore.religion.push(entry);

      if (charData.religion.death) {
        const deathEntry = `${charData.name}: ${charData.religion.death}`;
        const didx = lore.religionDeath.findIndex((r) => r.startsWith(`${charData.name}:`));
        if (didx !== -1) lore.religionDeath[didx] = deathEntry; else lore.religionDeath.push(deathEntry);
      }

      saveLore();
      exportLore();
    }
    savedCharacters[charData.name] = charData;
    fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), (err) => {
      if (err) console.error("Save error:", err);
      exportCharacters();
    });
    socket.emit("characterLoaded", charData);
  });

  socket.on("deleteCharacter", (name) => {
    delete savedCharacters[name];
    fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {
      exportCharacters();
    });
  });

  socket.on("loadAllCharacters", () => {
    socket.emit("allCharacters", savedCharacters);
  });

  socket.on("editCharacter", ({ name, data }) => {
    if (savedCharacters[name]) {
      savedCharacters[name] = { ...savedCharacters[name], ...data };
      fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {
        exportCharacters();
      });
      socket.emit("characterLoaded", savedCharacters[name]);
    }
  });

  socket.on("giveItem", ({ name, item, gp }) => {
    const c = savedCharacters[name];
    if (c) {
      if (item) {
        c.inventory = c.inventory || [];
        c.inventory.push(item);
      }
      if (gp) {
        c.gold = (c.gold || 0) + gp;
      }
      fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {
        exportCharacters();
      });
    }
  });

  socket.on("removeStatus", ({ name, status }) => {
    const c = savedCharacters[name];
    if (c && c.status) {
      c.status = c.status.filter((s) => s !== status);
      if (status === "drunk") c.beersDrank = 0;
      fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {
        exportCharacters();
      });
      socket.emit("characterLoaded", c);
    }
  });

  socket.on("equipItem", ({ name, item }) => {
    const c = savedCharacters[name];
    if (c) {
      c.inventory = c.inventory || [];
      c.equipped = c.equipped || [];
      if (c.inventory.includes(item) && !c.equipped.includes(item)) {
        c.equipped.push(item);
      }
      fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {
        exportCharacters();
      });
      socket.emit("characterLoaded", c);
    }
  });

  socket.on("unequipItem", ({ name, item }) => {
    const c = savedCharacters[name];
    if (c && c.equipped) {
      const idx = c.equipped.indexOf(item);
      if (idx !== -1) c.equipped.splice(idx, 1);
      fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {
        exportCharacters();
      });
      socket.emit("characterLoaded", c);
    }
  });

  socket.on("removeItem", ({ name, item }) => {
    const c = savedCharacters[name];
    if (c) {
      const idx = (c.inventory || []).indexOf(item);
      if (idx !== -1) c.inventory.splice(idx, 1);
      const eidx = (c.equipped || []).indexOf(item);
      if (eidx !== -1) c.equipped.splice(eidx, 1);
      fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {
        exportCharacters();
      });
      socket.emit("characterLoaded", c);
    }
  });

  socket.on("editMap", ({ name, data }) => {
    if (maps[name]) {
      maps[name] = data;
      saveMaps();
      exportMaps();
      if (sharedMap === name) io.emit("mapData", maps[name]);
    }
  });

  socket.on("editLore", ({ chapter, data }) => {
    if (lore[chapter]) {
      lore[chapter] = data;
      saveLore();
      exportLore();
      io.emit("loreData", {
        characters: [
          ...lore.characters,
          ...Object.values(savedCharacters).map((c) => `${c.name} - ${c.class}`),
        ],
        deaths: lore.deaths,
        events: lore.events,
        locations: lore.locations,
        religion: lore.religion,
        religionDeath: lore.religionDeath,
      });
    }
  });

  socket.on("editLog", (text) => {
    campaignLog = text.split(/\r?\n/).filter(Boolean);
    fs.writeFile(LOG_FILE, campaignLog.join("\n"), () => {});
    io.emit("campaignLog", campaignLog);
  });

  socket.on("setCharIcon", ({ name, icon }) => {
    if (savedCharacters[name]) {
      savedCharacters[name].icon = icon;
      fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {
        exportCharacters();
      });
      const pos = playerPositions[name] || { x: 0, y: 0 };
      playerPositions[name] = { x: pos.x, y: pos.y, icon };
      io.emit("playerPositions", playerPositions);
    }
  });

  socket.on("movePlayer", ({ name, x, y }) => {
    if (savedCharacters[name] && savedCharacters[name].icon) {
      playerPositions[name] = { x, y, icon: savedCharacters[name].icon };
      io.emit("playerPositions", playerPositions);
    }
  });

  socket.on("getPlayerPositions", () => {
    socket.emit("playerPositions", playerPositions);
  });

  socket.on("playerMessage", ({ name, message }) => {
    // Consume items prefixed with # and subtract gold when $amount is found
    const char = savedCharacters[name];
    if (char) {
      const itemRegex = /#([\w ]+)/g;
      let match;
      let drankBeer = false;
      while ((match = itemRegex.exec(message))) {
        const itemName = match[1].trim().toLowerCase();
        const idx = (char.inventory || []).findIndex(
          (it) => it.toLowerCase() === itemName
        );
        if (idx !== -1) {
          const removed = char.inventory.splice(idx, 1)[0];
          if (removed.toLowerCase() === "beer") {
            drankBeer = true;
            char.beersDrank = (char.beersDrank || 0) + 1;
            const chance = Math.min(6, char.beersDrank) / 6;
            if (Math.random() < chance) {
              char.status = char.status || [];
              if (!char.status.includes("drunk")) char.status.push("drunk");
            }
          }
          const eqIdx = (char.equipped || []).findIndex(
            (it) => it.toLowerCase() === itemName
          );
          if (eqIdx !== -1) {
            char.equipped.splice(eqIdx, 1);
          }
        }
      }

      const goldRegex = /\$(\d+)/g;
      while ((match = goldRegex.exec(message))) {
        const amt = parseInt(match[1], 10);
        if (!isNaN(amt)) {
          char.gold = Math.max(0, (char.gold || 0) - amt);
        }
      }
      fs.writeFile(CHAR_FILE, JSON.stringify(savedCharacters, null, 2), () => {
        exportCharacters();
      });
    }

    let finalMsg = message;
    if (char && (char.status || []).includes("drunk")) {
      finalMsg = message.split("").sort(() => Math.random() - 0.5).join("");
    }

    const entry = `[Player] ${name}: ${finalMsg}`;
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

  socket.on("gmChar", (message) => {
    const entry = `[CHAR] ${message}`;
    campaignLog.push(entry);
    fs.appendFile(LOG_FILE, entry + "\n", () => {});
    io.emit("logUpdate", entry);
  });

  socket.on("gmEvent", (message) => {
    const entry = `[EVENT] ${message}`;
    campaignLog.push(entry);
    fs.appendFile(LOG_FILE, entry + "\n", () => {});
    io.emit("logUpdate", entry);
  });

  socket.on("gmStory", (message) => {
    const entry = `[STORY] ${message}`;
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
    exportMaps();
  });

  socket.on("deleteMap", (name) => {
    if (maps[name]) {
      delete maps[name];
      if (sharedMap === name) sharedMap = Object.keys(maps)[0] || null;
      if (currentMap === name) currentMap = sharedMap;
      saveMaps();
      exportMaps();
    }
  });

  socket.on("shareMap", (name) => {
    if (maps[name]) {
      sharedMap = name;
      saveMaps();
      exportMaps();
      io.emit("mapData", maps[name]);
    }
  });

  socket.on("updateMapCell", ({ x, y, value }) => {
    const map = maps[currentMap];
    if (map && map[y] && typeof map[y][x] !== "undefined") {
      map[y][x] = value;
      saveMaps();
      exportMaps();
      if (currentMap === sharedMap) io.emit("mapData", map);
      else socket.emit("mapData", map);
    }
  });

  socket.on("fillMap", (value) => {
    const map = maps[currentMap];
    if (map) {
      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          map[y][x] = value;
        }
      }
      saveMaps();
      exportMaps();
      if (currentMap === sharedMap) io.emit("mapData", map);
      else socket.emit("mapData", map);
    }
  });

  socket.on("getLore", () => {
    const chars = Object.values(savedCharacters).map(
      (c) => `${c.name} - ${c.class}`
    );
    socket.emit("loreData", {
      characters: [...lore.characters, ...chars],
      deaths: lore.deaths,
      events: lore.events,
      locations: lore.locations,
      religion: lore.religion,
      religionDeath: lore.religionDeath,
    });
  });

  socket.on("addLore", ({ chapter, text }) => {
    if (lore[chapter]) {
      lore[chapter].push(text);
      saveLore();
      exportLore();
      io.emit("loreData", {
        characters: [
          ...lore.characters,
          ...Object.values(savedCharacters).map(
            (c) => `${c.name} - ${c.class}`
          ),
        ],
        deaths: lore.deaths,
        events: lore.events,
        locations: lore.locations,
        religion: lore.religion,
        religionDeath: lore.religionDeath,
      });
    }
  });

  socket.on("getSharedText", () => {
    socket.emit("sharedText", sharedText);
  });

  socket.on("updateSharedText", (text) => {
    sharedText = text;
    io.emit("sharedText", sharedText);
  });

  socket.on("saveAll", () => {
    saveAll();
    exportAll();
  });

  socket.on("exportAll", () => {
    exportAll();
  });

  socket.on("loadAllData", () => {
    loadAll();
    socket.emit("allCharacters", savedCharacters);
    io.emit("campaignLog", campaignLog);
    if (sharedMap && maps[sharedMap]) {
      io.emit("mapData", maps[sharedMap]);
    }
    io.emit("loreData", {
      characters: [
        ...lore.characters,
        ...Object.values(savedCharacters).map((c) => `${c.name} - ${c.class}`),
      ],
      deaths: lore.deaths,
      events: lore.events,
      locations: lore.locations,
      religion: lore.religion,
      religionDeath: lore.religionDeath,
    });
  });

  socket.on("exportCharacter", (name) => {
    if (savedCharacters[name]) {
      const file = path.join(CHAR_DIR, `${name}.json`);
      fs.writeFile(file, JSON.stringify(savedCharacters[name], null, 2), () => {});
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    const name = playerNames[socket.id];
    if (name) {
      delete playerNames[socket.id];
      delete readyState[name];
      delete playerPositions[name];
      io.emit("readyList", readyState);
      io.emit("playerPositions", playerPositions);
    }
  });
});

server.listen(PORT, () => {
  console.log(`OSE RPG server running on port ${PORT}`);
});
