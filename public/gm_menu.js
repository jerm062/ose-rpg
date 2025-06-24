const socket = io();
const display = document.getElementById('menuDisplay');
const input = document.getElementById('gmInput');
const logDisplay = document.getElementById('logDisplay');
const canvas = document.getElementById('hexMap');
const palette = document.getElementById('tilePalette');
const mapControls = document.getElementById('mapControls');
const mapNameInput = document.getElementById('mapName');
const saveMapBtn = document.getElementById('saveMapBtn');
const readyDisplay = document.getElementById('readyDisplay');
const ctx = canvas.getContext('2d');
const cellSize = TILE_SIZE;
let mode = 'main';
let mapData = [];
let mapName = '';
let selectedTile = '';

let tiles = [];

function buildPalette() {
  palette.innerHTML = '';
  tiles.forEach((t) => {
    const c = document.createElement('canvas');
    c.width = c.height = cellSize;
    c.className = 'tileBtn';
    const cctx = c.getContext('2d');
    drawTile(cctx, t);
    if (t === selectedTile) c.classList.add('tileSel');
    c.onclick = () => {
      selectedTile = t;
      document
        .querySelectorAll('.tileBtn')
        .forEach((b) => b.classList.remove('tileSel'));
      c.classList.add('tileSel');
    };
    palette.appendChild(c);
  });
}

function colorize(text) {
  return text
    .replace(/#([\w ]+)/g, '<span class="item">#$1</span>')
    .replace(/\$(\d+)/g, '<span class="gold">$$$1</span>')
    .replace(/@([\w ]+)/g, '<span class="char">@$1</span>')
    .replace(/&([\w ]+)/g, '<span class="location">&$1</span>')
    .replace(/!([\w ]+)/g, '<span class="spell">!$1</span>')
    .replace(/%([\w ]+)/g, '<span class="monster">%$1</span>');
}

function showMainMenu() {
  display.textContent =
    'GM Menu\n' +
    '1. Character Menu\n' +
    '2. Map Menu\n' +
    '3. Campaign log\n' +
    '4. Send DM message\n' +
    '5. Help';
  canvas.style.display = 'none';
  palette.style.display = 'none';
  mapControls.style.display = 'none';
  mode = 'main';
}

function showCharMenu() {
  display.textContent =
    'Character Menu\n' +
    '1. List characters\n' +
    '2. Delete character\n' +
    '3. Save character\n' +
    '0. Return';
  canvas.style.display = 'none';
  palette.style.display = 'none';
  mapControls.style.display = 'none';
  mode = 'charMenu';
}

function showMapMenu() {
  display.textContent =
    'Map Menu\n' +
    '1. View map\n' +
    '2. Edit map\n' +
    '3. Save map\n' +
    '4. Load map\n' +
    '5. Delete map\n' +
    '6. Share map\n' +
    '0. Return';
  canvas.style.display = 'none';
  palette.style.display = 'none';
  mapControls.style.display = 'none';
  mode = 'mapMenu';
}

function drawMap() {
  canvas.width = mapData[0].length * cellSize;
  canvas.height = mapData.length * cellSize;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < mapData.length; y++) {
    for (let x = 0; x < mapData[y].length; x++) {
      drawTile(ctx, mapData[y][x], x * cellSize, y * cellSize);
    }
  }
  canvas.style.display = 'block';
  if (mode === 'editmap') palette.style.display = 'block';
}

input.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    const text = input.value.trim();
    input.value = '';
    handleInput(text);
  }
});

function handleInput(text) {
  if (mode === 'main') {
    switch (text) {
      case '1':
        showCharMenu();
        break;
      case '2':
        showMapMenu();
        break;
      case '3':
        socket.emit('getCampaignLog');
        mode = 'log';
        break;
      case '4':
        display.textContent = 'Enter DM message:';
        mode = 'dmmsg';
        break;
      case '5':
        display.textContent =
          'GM Help:\n/ready players send /ready or /unready in chat to toggle status.' +
          '\nUse menu numbers to access tools.\n0. Return';
        mode = 'help';
        break;
      default:
        showMainMenu();
    }
  } else if (mode === 'charMenu') {
    switch (text) {
      case '1':
        socket.emit('loadAllCharacters');
        break;
      case '2':
        display.textContent = 'Enter character name to delete:';
        mode = 'delete';
        break;
      case '3':
        display.textContent = 'Enter character JSON:';
        mode = 'savechar';
        break;
      case '0':
        showMainMenu();
        break;
      default:
        showCharMenu();
    }
  } else if (mode === 'mapMenu') {
    switch (text) {
      case '1':
        mapName = 'shared';
        socket.emit('getMap');
        mode = 'viewmap';
        break;
      case '2':
        mapName = 'shared';
        socket.emit('getMap');
        buildPalette();
        mapNameInput.value = mapName;
        mapControls.style.display = 'block';
        mode = 'editmap';
        break;
      case '3':
        display.textContent = 'Enter name to save current map:';
        mode = 'savemap';
        break;
      case '4':
        socket.emit('getMapList');
        mode = 'loadmaplist';
        break;
      case '5':
        socket.emit('getMapList');
        mode = 'deletemaplist';
        break;
      case '6':
        socket.emit('getMapList');
        mode = 'sharemaplist';
        break;
      case '0':
        showMainMenu();
        break;
      default:
        showMapMenu();
    }
  } else if (mode === 'delete') {
    socket.emit('deleteCharacter', text);
    showMainMenu();
  } else if (mode === 'dmmsg') {
    socket.emit('dmMessage', text);
    showMainMenu();
  } else if (mode === 'log') {
    if (text === '0') showMainMenu();
  } else if (mode === 'viewmap' || mode === 'editmap') {
    if (text === '0') {
      showMainMenu();
      palette.style.display = 'none';
      mapControls.style.display = 'none';
    }
  } else if (mode === 'help') {
    if (text === '0') {
      showMainMenu();
    }
  } else if (mode === 'savemap') {
    mapName = text;
    socket.emit('saveMap', { name: text, data: mapData });
    showMainMenu();
  } else if (mode === 'loadmap') {
    socket.emit('loadMap', text);
    mapName = text;
    buildPalette();
    mapNameInput.value = mapName;
    mapControls.style.display = 'block';
    mode = 'editmap';
  } else if (mode === 'deletemap') {
    socket.emit('deleteMap', text);
    showMainMenu();
  } else if (mode === 'sharemap') {
    socket.emit('shareMap', text);
    showMainMenu();
  } else if (mode === 'savechar') {
    try {
      const obj = JSON.parse(text);
      socket.emit('saveCharacter', obj);
      display.textContent = 'Character saved.';
    } catch (e) {
      display.textContent = 'Invalid JSON.';
    }
    mode = 'help';
  }
}

socket.on('allCharacters', (chars) => {
  display.textContent = 'Characters:\n' + Object.keys(chars).join('\n');
});

socket.on('campaignLog', (log) => {
  logDisplay.innerHTML = log.map(colorize).join('<br>');
});

socket.on('logUpdate', (entry) => {
  logDisplay.innerHTML += '<br>' + colorize(entry);
});

socket.on('mapData', (data) => {
  mapData = data;
  drawMap();
  if (mode === 'viewmap') {
    display.textContent = `Viewing map: ${mapName}\n0. Return`;
  } else if (mode === 'editmap') {
    display.textContent = `Editing map: ${mapName}\n0. Return`;
    mapNameInput.value = mapName;
    mapControls.style.display = 'block';
  }
});

socket.on('mapList', (list) => {
  display.textContent = 'Maps:\n' + list.join('\n') + '\nEnter name:';
  if (mode === 'loadmaplist') mode = 'loadmap';
  else if (mode === 'deletemaplist') mode = 'deletemap';
  else if (mode === 'sharemaplist') mode = 'sharemap';
});

socket.on('readyList', (list) => {
  readyDisplay.textContent = Object.entries(list)
    .map(([n, r]) => `${r ? '[READY]' : '[    ]'} ${n}`)
    .join('\n');
});

canvas.addEventListener('click', (ev) => {
  if (mode !== 'editmap') return;
  const x = Math.floor(ev.offsetX / cellSize);
  const y = Math.floor(ev.offsetY / cellSize);
  if (mapData[y] && typeof mapData[y][x] !== 'undefined') {
    mapData[y][x] = selectedTile;
    drawMap();
    socket.emit('updateMapCell', { x, y, value: mapData[y][x] });
  }
});

saveMapBtn.addEventListener('click', () => {
  const name = mapNameInput.value.trim() || mapName || 'unnamed';
  mapName = name;
  socket.emit('saveMap', { name, data: mapData });
});

(async () => {
  await loadTileset();
  tiles = TILES;
  selectedTile = TILES[0];
  showMainMenu();
  input.focus();
})();
