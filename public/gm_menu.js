const socket = io();
const display = document.getElementById('menuDisplay');
const input = document.getElementById('gmInput');
const logDisplay = document.getElementById('logDisplay');
const canvas = document.getElementById('hexMap');
const ctx = canvas.getContext('2d');
const cellSize = 30;
let mode = 'menu';
let mapData = [];

function showMenu() {
  display.textContent =
    'GM Menu\n' +
    '1. List characters\n' +
    '2. Delete character\n' +
    '3. Campaign log\n' +
    '4. Send DM message\n' +
    '5. View map\n' +
    '6. Edit map\n' +
    '0. Return to menu';
  canvas.style.display = 'none';
  mode = 'menu';
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < mapData.length; y++) {
    for (let x = 0; x < mapData[y].length; x++) {
      ctx.fillStyle = mapData[y][x] === '#' ? '#555' : '#222';
      ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
    }
  }
  canvas.style.display = 'block';
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
  }
}

socket.on('allCharacters', (chars) => {
  display.textContent = 'Characters:\n' + Object.keys(chars).join('\n');
});

socket.on('campaignLog', (log) => {
  logDisplay.textContent = log.join('\n');
});

socket.on('logUpdate', (entry) => {
  logDisplay.textContent += entry + '\n';
});

socket.on('mapData', (data) => {
  mapData = data;
  drawMap();
});

canvas.addEventListener('click', (ev) => {
  if (mode !== 'editmap') return;
  const x = Math.floor(ev.offsetX / cellSize);
  const y = Math.floor(ev.offsetY / cellSize);
  if (mapData[y] && typeof mapData[y][x] !== 'undefined') {
    mapData[y][x] = mapData[y][x] === '.' ? '#' : '.';
    drawMap();
    socket.emit('updateMapCell', { x, y, value: mapData[y][x] });
  }
});

showMenu();
input.focus();
