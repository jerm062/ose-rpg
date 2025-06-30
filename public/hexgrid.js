(() => {
  const canvas = document.getElementById('hexCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const radius = 20;
  const hexH = Math.sqrt(3) * radius;
  const cols = Math.floor(canvas.width / (radius * 1.5));
  const rows = Math.floor(canvas.height / hexH);
  const tiles = loadHexTiles ? loadHexTiles() : {};
  const toolbar = document.getElementById('hexToolbar');
  const gm = window.gmMode;

  const tileNames = Object.keys(tiles);
  const defaultTile = tileNames.includes('plains') ? 'plains' : tileNames[0];
  let selectedTile = defaultTile;
  let map = [];

  const saved = localStorage.getItem('hexMap');
  if (saved) {
    try { map = JSON.parse(saved); } catch (e) { map = []; }
  }
  if (!map.length) {
    map = Array.from({ length: rows }, () => Array(cols).fill(defaultTile));
  }

  function hexCorner(cx, cy, i) {
    const angle = Math.PI / 3 * i;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  }

  function drawHex(cx, cy) {
    ctx.beginPath();
    const [sx, sy] = hexCorner(cx, cy, 0);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < 6; i++) {
      const [x, y] = hexCorner(cx, cy, i);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  function saveMap() {
    localStorage.setItem('hexMap', JSON.stringify(map));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let idx = 1;
    for (let q = 0; q < cols; q++) {
      for (let r = 0; r < rows; r++) {
        const cx = radius * 1.5 * q + radius;
        const cy = hexH * (r + 0.5 * (q % 2)) + radius;
        const name = map[r][q];
        const img = tiles[name];
        if (img) {
          ctx.drawImage(img, cx - radius + 2, cy - radius + 2, radius * 2 - 4, radius * 2 - 4);
        }
        drawHex(cx, cy);
        ctx.fillText(idx, cx, cy);
        idx++;
      }
    }
  }

  if (gm && toolbar) {
    toolbar.style.display = 'flex';
    tileNames.forEach((name) => {
      const btn = document.createElement('canvas');
      btn.width = 30;
      btn.height = 30;
      btn.className = 'tileBtn';
      const bctx = btn.getContext('2d');
      const img = tiles[name];
      if (img) bctx.drawImage(img, 5, 5, 20, 20);
      if (name === selectedTile) btn.classList.add('tileSel');
      btn.onclick = () => {
        selectedTile = name;
        toolbar.querySelectorAll('.tileBtn').forEach(b => b.classList.remove('tileSel'));
        btn.classList.add('tileSel');
      };
      toolbar.appendChild(btn);
    });

    canvas.addEventListener('click', (ev) => {
      const x = ev.offsetX;
      const y = ev.offsetY;
      const q = Math.floor(x / (radius * 1.5));
      const r = Math.floor((y - (q % 2) * hexH / 2) / hexH);
      if (q >= 0 && q < cols && r >= 0 && r < rows) {
        map[r][q] = selectedTile;
        saveMap();
        draw();
      }
    });
  }

  draw();
})();
