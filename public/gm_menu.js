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
let currentTile = '.';

const tiles = {
  '.': (ctx, x, y, s) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, s, s);
  },
  '#': (ctx, x, y, s) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, s, s);
  },
  't': (ctx, x, y, s) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(x + s * 0.45, y + s * 0.6, s * 0.1, s * 0.3);
    ctx.beginPath();
    ctx.moveTo(x + s * 0.2, y + s * 0.6);
    ctx.lineTo(x + s * 0.5, y + s * 0.2);
    ctx.lineTo(x + s * 0.8, y + s * 0.6);
    ctx.closePath();
    ctx.fill();
  },
  '~': (ctx, x, y, s) => {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.1, y + s * 0.4);
    ctx.quadraticCurveTo(x + s * 0.3, y + s * 0.5, x + s * 0.5, y + s * 0.4);
    ctx.quadraticCurveTo(x + s * 0.7, y + s * 0.3, x + s * 0.9, y + s * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.1, y + s * 0.65);
    ctx.quadraticCurveTo(x + s * 0.3, y + s * 0.75, x + s * 0.5, y + s * 0.65);
    ctx.quadraticCurveTo(x + s * 0.7, y + s * 0.55, x + s * 0.9, y + s * 0.65);
    ctx.stroke();
  },
  '^': (ctx, x, y, s) => {
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.5, y + s * 0.2);
    ctx.lineTo(x + s * 0.85, y + s * 0.8);
    ctx.lineTo(x + s * 0.15, y + s * 0.8);
    ctx.closePath();
    ctx.fill();
  },
  'T': (ctx, x, y, s) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(x + s * 0.2, y + s * 0.45, s * 0.6, s * 0.35);
    ctx.beginPath();
    ctx.moveTo(x + s * 0.15, y + s * 0.45);
    ctx.lineTo(x + s * 0.5, y + s * 0.2);
    ctx.lineTo(x + s * 0.85, y + s * 0.45);
    ctx.closePath();
    ctx.fill();
  },
};

function setupPalette() {
  palette.innerHTML = '';
  for (const key of Object.keys(tiles)) {
    const c = document.createElement('canvas');
    c.width = c.height = cellSize;
    const cctx = c.getContext('2d');
    tiles[key](cctx, 0, 0, cellSize);
    c.style.border = key === currentTile ? '2px solid red' : '1px solid var(--border)';
    c.addEventListener('click', () => {
      currentTile = key;
      setupPalette();
    });
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < mapData.length; y++) {
    for (let x = 0; x < mapData[y].length; x++) {
      const ch = mapData[y][x];
      const fn = tiles[ch] || tiles['.'];
      fn(ctx, x * cellSize, y * cellSize, cellSize);
    }
  }
  canvas.style.display = 'block';
  palette.style.display = 'block';
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
  setupPalette();
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
    mapData[y][x] = currentTile;
    drawMap();
    socket.emit('updateMapCell', { x, y, value: mapData[y][x] });
  }
});

showMenu();
setupPalette();
input.focus();
