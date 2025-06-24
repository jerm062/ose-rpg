const socket = io();
const display = document.getElementById('menuDisplay');
const input = document.getElementById('gmInput');
const logDisplay = document.getElementById('logDisplay');
const canvas = document.getElementById('hexMap');
const palette = document.getElementById('tilePalette');
const readyDisplay = document.getElementById('readyDisplay');
const ctx = canvas.getContext('2d');
const cellSize = TILE_SIZE;
let mode = 'menu';
let mapData = [];
let mapName = '';
let selectedTile = '#';

const tiles = TILES;

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

function showMenu() {
  display.textContent =
    'GM Menu\n' +
    '1. List characters\n' +
    '2. Delete character\n' +
    '3. Campaign log\n' +
    '4. Send DM message\n' +
    '5. View map\n' +
    '6. Edit map\n' +
    '7. Help\n' +
    '8. Save map\n' +
    '9. Load map\n' +
    '10. Delete map\n' +
    '11. Share map\n' +
    '12. Save character\n' +
    '0. Return to menu';
  canvas.style.display = 'none';
  palette.style.display = 'none';
  mode = 'menu';
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
  if (mode === 'menu') {
    switch (text) {
      case '1':
        socket.emit('loadAllCharacters');
        break;
      case '2':
        display.textContent = 'Enter character name to delete:';
        mode = 'delete';
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
        mapName = 'shared';
        socket.emit('getMap');
        mode = 'viewmap';
        break;
      case '6':
        mapName = 'shared';
        socket.emit('getMap');
        buildPalette();
        mode = 'editmap';
        break;
      case '7':
        display.textContent =
          'GM Help:\n/ready players send /ready or /unready in chat to toggle status.' +
          '\nUse menu numbers to access tools.\n0. Return';
        mode = 'help';
        break;
      case '8':
        display.textContent = 'Enter name to save current map:';
        mode = 'savemap';
        break;
      case '9':
        socket.emit('getMapList');
        mode = 'loadmaplist';
        break;
      case '10':
        socket.emit('getMapList');
        mode = 'deletemaplist';
        break;
      case '11':
        socket.emit('getMapList');
        mode = 'sharemaplist';
        break;
      case '12':
        display.textContent = 'Enter character JSON:';
        mode = 'savechar';
        break;
      default:
        showMenu();
    }
  } else if (mode === 'delete') {
    socket.emit('deleteCharacter', text);
    showMenu();
  } else if (mode === 'dmmsg') {
    socket.emit('dmMessage', text);
    showMenu();
  } else if (mode === 'log') {
    if (text === '0') showMenu();
  } else if (mode === 'viewmap' || mode === 'editmap') {
    if (text === '0') {
      showMenu();
      palette.style.display = 'none';
    }
  } else if (mode === 'help') {
    if (text === '0') {
      showMenu();
    }
  } else if (mode === 'savemap') {
    mapName = text;
    socket.emit('saveMap', { name: text, data: mapData });
    showMenu();
  } else if (mode === 'loadmap') {
    socket.emit('loadMap', text);
    mapName = text;
    buildPalette();
    mode = 'editmap';
  } else if (mode === 'deletemap') {
    socket.emit('deleteMap', text);
    showMenu();
  } else if (mode === 'sharemap') {
    socket.emit('shareMap', text);
    showMenu();
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

showMenu();
input.focus();
