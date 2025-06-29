const bitsyTiles = {};
async function loadBitsyTiles() {
  if (Object.keys(bitsyTiles).length) return bitsyTiles;
  try {
    const resp = await fetch('/BitsyDungeonTilesby_enui.html');
    const html = await resp.text();
    const match = html.match(/<script[^>]*id="exportedGameData"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return bitsyTiles;
    const data = match[1];
    const lines = data.split(/\r?\n/);
    let palette = ['#000', '#fff', '#fff'];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('PAL 0')) {
        const colors = [];
        for (let j = 1; j <= 3; j++) {
          const l = lines[i + j] && lines[i + j].trim();
          if (/^[0-9]+,[0-9]+,[0-9]+$/.test(l)) {
            colors.push(`rgb(${l})`);
          }
        }
        if (colors.length === 3) palette = colors;
        break;
      }
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('TIL ')) {
        const id = line.split(' ')[1];
        const pixels = [];
        for (let j = i + 1; j < lines.length; j++) {
          const l = lines[j].trim();
          if (l === '>' || l.startsWith('NAME') || l.startsWith('PAL') || l.startsWith('TIL ')) {
            break;
          }
          if (/^[0-9]{8}$/.test(l)) {
            pixels.push(l);
            if (pixels.length === 8) break;
          } else {
            break;
          }
        }
        bitsyTiles[id] = pixels;
      }
    }
    Object.keys(bitsyTiles).forEach((id) => {
      const pix = bitsyTiles[id];
      const c = document.createElement('canvas');
      c.width = TILE_SIZE;
      c.height = TILE_SIZE;
      const ctx = c.getContext('2d');
      const scale = TILE_SIZE / 8;
      ctx.fillStyle = palette[0];
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = palette[1];
      for (let y = 0; y < pix.length; y++) {
        for (let x = 0; x < pix[y].length; x++) {
          if (pix[y][x] === '1') {
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      }
      const img = new Image();
      img.src = c.toDataURL();
      tileImages[id] = img;
    });
    TILES = Object.keys(bitsyTiles);
    tilesLoaded = true;
  } catch (e) {
    console.error('Failed to load Bitsy tiles', e);
  }
  return bitsyTiles;
}
window.loadBitsyTiles = loadBitsyTiles;
