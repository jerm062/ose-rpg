const socket = io();
const display = document.getElementById('menuDisplay');
const input = document.getElementById('gmInput');
const logDisplay = document.getElementById('logDisplay');
const canvas = document.getElementById('hexMap');
const palette = document.getElementById('tilePalette');
const colorPaletteEl = document.getElementById('colorPalette');
const mapControls = document.getElementById('mapControls');
const mapNameInput = document.getElementById('mapName');
const saveMapBtn = document.getElementById('saveMapBtn');
const newMapBtn = document.getElementById('newMapBtn');
const readyDisplay = document.getElementById('readyDisplay');
const ctx = canvas.getContext('2d');
const cellSize = TILE_SIZE;
let mode = 'main';
let mapData = [];
let mapHidden = [];
let mapNotes = [];
let lastTrail = null;
let mapName = '';
let selectedTile = '';
let selectedColor = '#000000';
let numberedMap = false;

let charNameTemp = '';

let tiles = [];
const colorPalette = ['#592B18','#8A5A2B','#4A3C2B','#2E4A3C','#403A6C','#6C2E47','#5B2814','#383838'];

function generateRegionMap(size) {
  mapData = Array.from({ length: size }, () => Array(size).fill(''));
  mapHidden = Array.from({ length: size }, () => Array(size).fill(true));
  mapNotes = Array.from({ length: size }, () => Array(size).fill(''));
  const features = ['Village','Ruins','Forest','Lake','Mount','Caves','Tower','Keep','Mine','Shrine'];
  features.forEach((f) => {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    mapData[y][x] = f[0].toUpperCase();
  });
}

function buildColorPalette() {
  colorPaletteEl.innerHTML = '';
  colorPalette.forEach((c) => {
    const d = document.createElement('div');
    d.className = 'colorBtn';
    d.style.background = c;
    if (c === selectedColor) d.classList.add('colorSel');
    d.onclick = () => {
      selectedColor = c;
      document
        .querySelectorAll('.colorBtn')
        .forEach((b) => b.classList.remove('colorSel'));
      d.classList.add('colorSel');
    };
    colorPaletteEl.appendChild(d);
  });
}

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
  colorPaletteEl.style.display = 'none';
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
    '5. View sheet\n' +
    '6. Give item/gold\n' +
    '7. Remove status\n' +
    '0. Return';
  canvas.style.display = 'none';
  palette.style.display = 'none';
  colorPaletteEl.style.display = 'none';
  mapControls.style.display = 'none';
  mode = 'charMenu';
}

function showMapMenu() {
  display.textContent =
    'Map Menu\n' +
    '1. New map\n' +
    '2. Map list\n' +
    '3. Share map\n' +
    '4. Delete map\n' +
    '0. Return';
  canvas.style.display = 'none';
  palette.style.display = 'none';
  colorPaletteEl.style.display = 'none';
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
    '5. Save all\n' +
    '6. Export all\n' +
    '7. Load all\n' +
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
      const cell = mapData[y][x];
      if (typeof cell === 'string' && cell && !cell.startsWith('#') && !tileImages[cell]) {
        if (/^[-~+][hv]$/.test(cell)) {
          ctx.fillStyle = '#222';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.strokeStyle = cell[0] === '+' ? 'red' : cell[0] === '~' ? '#666' : '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (cell[1] === 'h') {
            ctx.moveTo(x * cellSize, y * cellSize + cellSize/2);
            ctx.lineTo((x+1) * cellSize, y * cellSize + cellSize/2);
          } else {
            ctx.moveTo(x * cellSize + cellSize/2, y * cellSize);
            ctx.lineTo(x * cellSize + cellSize/2, (y+1) * cellSize);
          }
          ctx.stroke();
        } else {
          ctx.fillStyle = '#222';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.fillStyle = '#fff';
          ctx.font = '14px "Tiny5", monospace';
          ctx.fillText(cell, x * cellSize + 8, y * cellSize + 22);
        }
      } else {
        drawTile(ctx, cell, x * cellSize, y * cellSize);
      }
      if (mapHidden[y] && mapHidden[y][x]) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
      if (mapNotes[y] && mapNotes[y][x]) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(x * cellSize + cellSize-6, y * cellSize + cellSize-6, 5, 5);
      }
      if (numberedMap) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        const idx = y * mapData[0].length + x + 1;
        ctx.fillText(idx, x * cellSize + 2, y * cellSize + 10);
      }
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
  if (mode === 'editmap') {
    if (numberedMap) {
      colorPaletteEl.style.display = 'block';
      palette.style.display = 'none';
    } else {
      palette.style.display = 'block';
      colorPaletteEl.style.display = 'none';
    }
  }
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
        display.textContent = 'Add Lore\n1. Characters\n2. Deaths\n3. Events\n4. Locations\n5. Religion\n6. Religion Death';
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
      case '5':
        display.textContent = 'Enter character name to view:';
        mode = 'viewSheet';
        break;
      case '6':
        display.textContent = 'Enter character name to give item/gold:';
        mode = 'giveItemName';
        break;
      case '7':
        display.textContent = 'Enter character name to remove status:';
        mode = 'removeStatusName';
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
        display.textContent = 'Map Type\n1. World\n2. Region\n3. Dungeon\n0. Cancel';
        mode = 'newMapType';
        break;
      case '2':
        socket.emit('getMapList');
        mode = 'editmaplist';
        break;
      case '3':
        socket.emit('getMapList');
        mode = 'sharemaplist';
        break;
      case '4':
        socket.emit('getMapList');
        mode = 'deletemaplist';
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
      colorPaletteEl.style.display = 'none';
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
  } else if (mode === 'viewSheet') {
    window.open(`character.html?n=${encodeURIComponent(text)}&dm=1`, '_blank');
    showMainMenu();
  } else if (mode === 'giveItemName') {
    charNameTemp = text;
    display.textContent = 'Enter item name or "gp N":';
    mode = 'giveItemValue';
  } else if (mode === 'giveItemValue') {
    const m = text.match(/^gp\s+(\d+)/i);
    if (m) {
      socket.emit('giveItem', { name: charNameTemp, gp: parseInt(m[1], 10) });
    } else {
      socket.emit('giveItem', { name: charNameTemp, item: text });
    }
    charNameTemp = '';
    display.textContent = 'Given.';
    mode = 'help';
  } else if (mode === 'removeStatusName') {
    charNameTemp = text;
    display.textContent = 'Enter status to remove:';
    mode = 'removeStatusValue';
  } else if (mode === 'removeStatusValue') {
    socket.emit('removeStatus', { name: charNameTemp, status: text });
    charNameTemp = '';
    display.textContent = 'Status removed.';
    mode = 'help';
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
      case '5':
        display.textContent = 'Enter lore for Religion:';
        mode = 'loreEntryReligion';
        break;
      case '6':
        display.textContent = 'Enter lore for Religion Death:';
        mode = 'loreEntryReligionDeath';
        break;
      default:
        showMainMenu();
    }
  } else if (mode.startsWith('loreEntry')) {
    let chapter = mode.replace('loreEntry', '');
    if (chapter === 'ReligionDeath') chapter = 'religionDeath';
    else chapter = chapter.toLowerCase();
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
      case '5':
        socket.emit('saveAll');
        display.textContent = 'Data saved.';
        mode = 'help';
        break;
      case '6':
        socket.emit('exportAll');
        display.textContent = 'Data exported.';
        mode = 'help';
        break;
      case '7':
        socket.emit('loadAllData');
        display.textContent = 'Data loaded.';
        mode = 'help';
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
    charNameTemp = text;
    if (charNameTemp !== 'religionDeath') {
      charNameTemp = charNameTemp.toLowerCase();
    }
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
  } else if (mode === 'newMapType') {
    let size = 10;
    selectedColor = colorPalette[0];
    switch (text) {
      case '1':
        size = 10; // world map
        numberedMap = true;
        mapData = Array.from({ length: size }, () => Array(size).fill(selectedColor));
        mapHidden = Array.from({ length: size }, () => Array(size).fill(true));
        mapNotes = Array.from({ length: size }, () => Array(size).fill(''));
        break;
      case '2':
        size = 20; // region map
        numberedMap = false;
        generateRegionMap(size);
        break;
      case '3':
        size = 30; // dungeon map
        numberedMap = true;
        mapData = Array.from({ length: size }, () => Array(size).fill(selectedColor));
        mapHidden = Array.from({ length: size }, () => Array(size).fill(true));
        mapNotes = Array.from({ length: size }, () => Array(size).fill(''));
        break;
      default:
        showMapMenu();
        return;
    }
    mapName = '';
    mapNameInput.value = '';
    if (numberedMap) buildColorPalette(); else buildPalette();
    mapControls.style.display = 'block';
    drawMap();
    display.textContent = 'Editing new map\n0. Return';
    mode = 'editmap';
  } else if (mode === 'loadmap') {
    socket.emit('loadMap', text);
    mapName = text;
    buildPalette();
    numberedMap = false;
    mapNameInput.value = mapName;
    mapControls.style.display = 'block';
    mode = 'editmap';
  } else if (mode === 'sharemap') {
    socket.emit('shareMap', text);
    showMainMenu();
  } else if (mode === 'deletemap') {
    socket.emit('deleteMap', text);
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
  mapData = data.cells;
  mapHidden = data.hidden || mapData.map(r => r.map(() => true));
  mapNotes = data.notes || mapData.map(r => r.map(() => ''));
  numberedMap = typeof mapData[0][0] === 'string' && mapData[0][0].startsWith('#');
  if (numberedMap) buildColorPalette(); else buildPalette();
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
  else if (mode === 'deletemaplist') mode = 'deletemap';
});

socket.on('readyList', (list) => {
  readyDisplay.textContent = Object.entries(list)
    .map(([n, r]) => `${r ? '[READY]' : '[    ]'} ${n}`)
    .join('\n');
});


canvas.addEventListener('click', (ev) => {
  if (mode !== 'editmap' || ev.button !== 0) return;
  const x = Math.floor(ev.offsetX / cellSize);
  const y = Math.floor(ev.offsetY / cellSize);
  if (mapData[y] && typeof mapData[y][x] !== 'undefined') {
    if (ev.ctrlKey) {
      const note = prompt('Square description:', mapNotes[y][x] || '');
      if (note !== null) {
        mapNotes[y][x] = note;
        socket.emit('setMapNote', { x, y, text: note });
      }
    } else {
      if (numberedMap) {
        mapData[y][x] = selectedColor;
        lastTrail = null;
      } else {
        if (['-','~','+'].includes(selectedTile)) {
          let orient = 'h';
          if (lastTrail && Math.abs(lastTrail.x - x) + Math.abs(lastTrail.y - y) === 1) {
            orient = lastTrail.x !== x ? 'h' : 'v';
          }
          mapData[y][x] = selectedTile + orient;
          lastTrail = {x,y};
        } else {
          mapData[y][x] = selectedTile;
          lastTrail = null;
        }
      }
      socket.emit('updateMapCell', { x, y, value: mapData[y][x] });
    }
    drawMap();
  }
});

canvas.addEventListener('contextmenu', (ev) => {
  if (mode !== 'editmap') return;
  ev.preventDefault();
  const x = Math.floor(ev.offsetX / cellSize);
  const y = Math.floor(ev.offsetY / cellSize);
  if (mapHidden[y] && typeof mapHidden[y][x] !== 'undefined') {
    mapHidden[y][x] = !mapHidden[y][x];
    drawMap();
    socket.emit('setHiddenCell', { x, y, hidden: mapHidden[y][x] });
  }
});

saveMapBtn.addEventListener('click', () => {
  const name = mapNameInput.value.trim() || mapName || 'unnamed';
  mapName = name;
  socket.emit('saveMap', { name, data: { cells: mapData, hidden: mapHidden, notes: mapNotes } });
});

newMapBtn.addEventListener('click', () => {
  display.textContent = 'Map Type\n1. World\n2. Region\n3. Dungeon\n0. Cancel';
  mode = 'newMapType';
});

(async () => {
  await loadTileset();
  tiles = TILES;
  selectedTile = TILES[0];
  showMainMenu();
  input.focus();
})();
