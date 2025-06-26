const TILE_SIZE = 30;
let TILES = [];
const tileImages = {};
let tilesLoaded = false;

async function loadTileset() {
  if (tilesLoaded) return;
  // Icons directory has been removed; always load from organized tileset

  const resp = await fetch('/organized_tileset.json');
  const data = await resp.json();
  TILES = data.tiles.map((t) => t.name);
  const promises = data.tiles.map((t) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = `/organized_tiles/${t.filename}`;
      tileImages[t.name] = img;
    });
  });
  await Promise.all(promises);
  tilesLoaded = true;
}

function drawTile(targetCtx, type, x = 0, y = 0) {
  const img = tileImages[type];
  targetCtx.save();
  targetCtx.translate(x, y);
  targetCtx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
  if (img) {
    targetCtx.drawImage(img, 0, 0, TILE_SIZE, TILE_SIZE);
  } else if (typeof type === 'string' && type.startsWith('#')) {
    targetCtx.fillStyle = type;
    targetCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    targetCtx.strokeStyle = '#fff';
    targetCtx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  } else {
    targetCtx.fillStyle = '#fff';
    targetCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    targetCtx.strokeStyle = '#888';
    targetCtx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  }
  targetCtx.restore();
}

window.loadTileset = loadTileset;
