const socket = io();
const display = document.getElementById('menuDisplay');
const input = document.getElementById('gmInput');
const logDisplay = document.getElementById('logDisplay');
const canvas = document.getElementById('hexMap');
const palette = document.getElementById('tilePalette');
const mapControls = document.getElementById('mapControls');
const mapNameInput = document.getElementById('mapName');
const saveMapBtn = document.getElementById('saveMapBtn');
const newMapBtn = document.getElementById('newMapBtn');
const fillMapBtn = document.getElementById('fillMapBtn');
const readyDisplay = document.getElementById('readyDisplay');
const ctx = canvas.getContext('2d');
const cellSize = TILE_SIZE;
let mode = 'main';
let mapData = [];
let mapName = '';
let selectedTile = '';

let charNameTemp = '';

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
  if (text.startsWith('[CHAR]')) return '<span class="gmchar">' + text + '</span>';
  if (text.startsWith('[EVENT]')) return '<span class="gmevent">' + text + '</span>';
  if (text.startsWith('[STORY]')) return '<span class="gmstory">' + text + '</span>';
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
    '5. Character dialogue\n' +
    '6. Event dialogue\n' +
    '7. Story dialogue\n' +
    '8. Help\n' +
    '9. Add Lore\n' +
    '10. Edit Data';
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
    '4. Set icon\n' +
    '0. Return';
  canvas.style.display = 'none';
  palette.style.display = 'none';
  mapControls.style.display = 'none';
  mode = 'charMenu';
}

function showMapMenu() {
  display.textContent =
    'Map Menu\n' +
    '1. New map\n' +
    '2. Map list\n' +
    '3. Share map\n' +
    '0. Return';
  canvas.style.display = 'none';
  palette.style.display = 'none';
  mapControls.style.display = 'none';
  mode = 'mapMenu';
}

function showDataMenu() {
  display.textContent =
    'Data Menu\n' +
    '1. Edit character\n' +
    '2. Edit map\n' +
    '3. Edit lore\n' +
    '4. Edit log\n' +
    '0. Return';
  canvas.style.display = 'none';
  palette.style.display = 'none';
  mapControls.style.display = 'none';
  mode = 'dataMenu';
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
  ctx.strokeStyle = '#555';
  for (let x = 0; x <= mapData[0].length; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize + 0.5, 0);
    ctx.lineTo(x * cellSize + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= mapData.length; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize + 0.5);
    ctx.lineTo(canvas.width, y * cellSize + 0.5);
    ctx.stroke();
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
        display.textContent = 'Enter character name:';
        mode = 'chardName';
        break;
      case '6':
        display.textContent = 'Enter event dialogue:';
        mode = 'eventd';
        break;
      case '7':
        display.textContent = 'Enter story dialogue:';
        mode = 'storyd';
        break;
      case '8':
        display.textContent =
          'GM Help:\n/ready players send /ready or /unready in chat to toggle status.' +
          '\nUse menu numbers to access tools.\n0. Return';
        mode = 'help';
        break;
      case '9':
        display.textContent = 'Add Lore\n1. Characters\n2. Deaths\n3. Events\n4. Locations';
        mode = 'loreChapter';
        break;
      case '10':
        showDataMenu();
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
      case '4':
        display.textContent = 'Enter character name to set icon:';
        mode = 'iconName';
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
        mapData = Array.from({ length: 20 }, () => Array(20).fill(TILES[0]));
        mapName = '';
        buildPalette();
        mapNameInput.value = '';
        mapControls.style.display = 'block';
        palette.style.display = 'block';
        drawMap();
        display.textContent = 'Editing new map\n0. Return';
        mode = 'editmap';
        break;
      case '2':
        socket.emit('getMapList');
        mode = 'editmaplist';
        break;
      case '3':
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
  } else if (mode === 'chardName') {
    charNameTemp = text;
    display.textContent = `Enter dialogue for ${charNameTemp}:`;
    mode = 'chardText';
  } else if (mode === 'chardText') {
    socket.emit('gmChar', `${charNameTemp}: ${text}`);
    charNameTemp = '';
    showMainMenu();
  } else if (mode === 'eventd') {
    socket.emit('gmEvent', text);
    showMainMenu();
  } else if (mode === 'storyd') {
    socket.emit('gmStory', text);
    showMainMenu();
  } else if (mode === 'log') {
    if (text === '0') showMainMenu();
  } else if (mode === 'editmap') {
    if (text === '0') {
      showMainMenu();
      palette.style.display = 'none';
      mapControls.style.display = 'none';
    }
  } else if (mode === 'iconName') {
    charNameTemp = text;
    buildPalette();
    palette.style.display = 'block';
    display.textContent = 'Select icon then press Enter (0 cancel)';
    mode = 'iconPick';
  } else if (mode === 'iconPick') {
    if (text === '0') {
      palette.style.display = 'none';
      showMainMenu();
    } else {
      socket.emit('setCharIcon', { name: charNameTemp, icon: selectedTile });
      palette.style.display = 'none';
      display.textContent = 'Icon set.';
      mode = 'help';
    }
  } else if (mode === 'help') {
    if (text === '0') {
      showMainMenu();
    }
  } else if (mode === 'loreChapter') {
    switch (text) {
      case '1':
        display.textContent = 'Enter lore for Characters:';
        mode = 'loreEntryCharacters';
        break;
      case '2':
        display.textContent = 'Enter lore for Deaths:';
        mode = 'loreEntryDeaths';
        break;
      case '3':
        display.textContent = 'Enter lore for Events:';
        mode = 'loreEntryEvents';
        break;
      case '4':
        display.textContent = 'Enter lore for Locations:';
        mode = 'loreEntryLocations';
        break;
      default:
        showMainMenu();
    }
  } else if (mode.startsWith('loreEntry')) {
    const chapter = mode.replace('loreEntry', '').toLowerCase();
    socket.emit('addLore', { chapter, text });
    display.textContent = 'Lore added.';
    mode = 'help';
  } else if (mode === 'dataMenu') {
    switch (text) {
      case '1':
        display.textContent = 'Enter character name to edit:';
        mode = 'editCharName';
        break;
      case '2':
        display.textContent = 'Enter map name to edit:';
        mode = 'editMapName';
        break;
      case '3':
        display.textContent = 'Enter lore chapter:';
        mode = 'editLoreChapterInput';
        break;
      case '4':
        display.textContent = 'Enter full log text:';
        mode = 'editLog';
        break;
      case '0':
        showMainMenu();
        break;
      default:
        showDataMenu();
    }
  } else if (mode === 'editCharName') {
    charNameTemp = text;
    display.textContent = `Enter JSON patch for ${charNameTemp}:`;
    mode = 'editCharData';
  } else if (mode === 'editCharData') {
    try {
      const obj = JSON.parse(text);
      socket.emit('editCharacter', { name: charNameTemp, data: obj });
      display.textContent = 'Character updated.';
    } catch (e) {
      display.textContent = 'Invalid JSON.';
    }
    charNameTemp = '';
    mode = 'help';
  } else if (mode === 'editMapName') {
    mapName = text;
    display.textContent = `Enter map JSON for ${mapName}:`;
    mode = 'editMapData';
  } else if (mode === 'editMapData') {
    try {
      const obj = JSON.parse(text);
      socket.emit('editMap', { name: mapName, data: obj });
      display.textContent = 'Map updated.';
    } catch (e) {
      display.textContent = 'Invalid JSON.';
    }
    mode = 'help';
  } else if (mode === 'editLoreChapterInput') {
    charNameTemp = text.toLowerCase();
    display.textContent = `Enter JSON array for ${charNameTemp}:`;
    mode = 'editLoreData';
  } else if (mode === 'editLoreData') {
    try {
      const arr = JSON.parse(text);
      socket.emit('editLore', { chapter: charNameTemp, data: arr });
      display.textContent = 'Lore updated.';
    } catch (e) {
      display.textContent = 'Invalid JSON.';
    }
    charNameTemp = '';
    mode = 'help';
  } else if (mode === 'editLog') {
    socket.emit('editLog', text);
    display.textContent = 'Log updated.';
    mode = 'help';
  } else if (mode === 'loadmap') {
    socket.emit('loadMap', text);
    mapName = text;
    buildPalette();
    mapNameInput.value = mapName;
    mapControls.style.display = 'block';
    mode = 'editmap';
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
  if (mode === 'editmap') {
    display.textContent = `Editing map: ${mapName}\n0. Return`;
    mapNameInput.value = mapName;
    mapControls.style.display = 'block';
  }
});

socket.on('mapList', (list) => {
  display.textContent = 'Maps:\n' + list.join('\n') + '\nEnter name:';
  if (mode === 'editmaplist') mode = 'loadmap';
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

newMapBtn.addEventListener('click', () => {
  mapData = Array.from({ length: 20 }, () => Array(20).fill(TILES[0]));
  mapName = '';
  buildPalette();
  mapNameInput.value = '';
  mapControls.style.display = 'block';
  palette.style.display = 'block';
  drawMap();
  display.textContent = 'Editing new map\n0. Return';
  mode = 'editmap';
});

fillMapBtn.addEventListener('click', () => {
  if (mode !== 'editmap') return;
  for (let y = 0; y < mapData.length; y++) {
    mapData[y].fill(selectedTile);
  }
  drawMap();
  socket.emit('fillMap', selectedTile);
});

(async () => {
  await loadTileset();
  tiles = TILES;
  selectedTile = TILES[0];
  showMainMenu();
  input.focus();
})();
