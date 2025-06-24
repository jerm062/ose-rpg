const socket = io();
const display = document.getElementById('menuDisplay');
const input = document.getElementById('gmInput');
const logDisplay = document.getElementById('logDisplay');
const canvas = document.getElementById('hexMap');
const palette = document.getElementById('tilePalette');
const readyDisplay = document.getElementById('readyDisplay');
const ctx = canvas.getContext('2d');
const cellSize = 30;
let mode = 'menu';
let mapData = [];
let selectedTile = 0;

const tileImage = new Image();
tileImage.src = 'colored_transparent.png';
const tileSize = 36;
const tileSpacing = 1;
const tileMargin = 1;
let tileCols = 0;
let tileRows = 0;
let tileCount = 0;

tileImage.onload = () => {
  tileCols = Math.floor((tileImage.width - tileMargin) / (tileSize + tileSpacing));
  tileRows = Math.floor((tileImage.height - tileMargin) / (tileSize + tileSpacing));
  tileCount = tileCols * tileRows;
  if (mapData.length) drawMap();
};

function drawTile(targetCtx, index, x = 0, y = 0) {
  if (!tileCount) {
    // sheet not loaded yet, draw placeholder
    targetCtx.clearRect(x, y, cellSize, cellSize);
    targetCtx.strokeStyle = '#888';
    targetCtx.strokeRect(x, y, cellSize, cellSize);
    return;
  }
  const col = index % tileCols;
  const row = Math.floor(index / tileCols);
  const sx = tileMargin + col * (tileSize + tileSpacing);
  const sy = tileMargin + row * (tileSize + tileSpacing);
  targetCtx.drawImage(
    tileImage,
    sx,
    sy,
    tileSize,
    tileSize,
    x,
    y,
    cellSize,
    cellSize
  );
  targetCtx.strokeStyle = '#888';
  targetCtx.strokeRect(x, y, cellSize, cellSize);
}

function buildPalette() {
  if (!tileCount) {
    tileImage.onload = buildPalette;
    return;
  }
  palette.innerHTML = '';
  for (let i = 0; i < tileCount; i++) {
    const c = document.createElement('canvas');
    c.width = c.height = cellSize;
    c.className = 'tileBtn';
    const cctx = c.getContext('2d');
    drawTile(cctx, i);
    if (i === selectedTile) c.classList.add('tileSel');
    c.onclick = () => {
      selectedTile = i;
      document.querySelectorAll('.tileBtn').forEach((b) => b.classList.remove('tileSel'));
      c.classList.add('tileSel');
    };
    palette.appendChild(c);
  }
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
        socket.emit('getMap');
        mode = 'viewmap';
        break;
      case '6':
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
