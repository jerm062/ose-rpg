const HEX_TILES = {
  tree: [
    '00011000',
    '00111100',
    '01111110',
    '00111100',
    '00011000',
    '00011000',
    '00011000',
    '00000000'
  ],
  hill: [
    '00000000',
    '00000000',
    '00111100',
    '01111110',
    '11111111',
    '00000000',
    '00000000',
    '00000000'
  ],
  plains: [
    '00000000',
    '00000000',
    '00000000',
    '00000000',
    '00000000',
    '00000000',
    '00000000',
    '00000000'
  ],
  river: [
    '00100000',
    '00110000',
    '00110000',
    '00100000',
    '00110000',
    '00110000',
    '00110000',
    '00100000'
  ],
  pond: [
    '00000000',
    '00011000',
    '00111100',
    '00111100',
    '00111100',
    '00111100',
    '00011000',
    '00000000'
  ],
  mountain: [
    '00000000',
    '00010000',
    '00111000',
    '01111100',
    '11111110',
    '01111100',
    '00010000',
    '00000000'
  ],
  desert: [
    '00000000',
    '01000100',
    '00000000',
    '00100010',
    '00000000',
    '01000100',
    '00000000',
    '00100010'
  ]
};

const HEX_TILE_SIZE = 20;
const hexTileImages = {};

function loadHexTiles() {
  if (Object.keys(hexTileImages).length) return hexTileImages;
  Object.keys(HEX_TILES).forEach(name => {
    const pattern = HEX_TILES[name];
    const c = document.createElement('canvas');
    c.width = HEX_TILE_SIZE;
    c.height = HEX_TILE_SIZE;
    const ctx = c.getContext('2d');
    const scale = HEX_TILE_SIZE / pattern.length;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, HEX_TILE_SIZE, HEX_TILE_SIZE);
    ctx.fillStyle = '#fff';
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[y].length; x++) {
        if (pattern[y][x] === '1') {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    const img = new Image();
    img.src = c.toDataURL();
    hexTileImages[name] = img;
  });
  return hexTileImages;
}

window.loadHexTiles = loadHexTiles;
