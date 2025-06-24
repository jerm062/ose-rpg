const TILE_SIZE = 30;
const TILES = ['.', '#', 'T', 'H', 'D'];

function drawTile(targetCtx, type, x = 0, y = 0) {
  targetCtx.save();
  targetCtx.translate(x, y);
  targetCtx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
  targetCtx.fillStyle = '#fff';
  targetCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  targetCtx.fillStyle = '#000';
  switch (type) {
    case '#':
      targetCtx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      break;
    case 'T':
      targetCtx.beginPath();
      targetCtx.moveTo(TILE_SIZE / 2, 4);
      targetCtx.lineTo(4, TILE_SIZE - 4);
      targetCtx.lineTo(TILE_SIZE - 4, TILE_SIZE - 4);
      targetCtx.closePath();
      targetCtx.fill();
      break;
    case 'H':
      targetCtx.fillRect(4, TILE_SIZE / 2, TILE_SIZE - 8, TILE_SIZE / 2 - 4);
      targetCtx.beginPath();
      targetCtx.moveTo(TILE_SIZE / 2, 4);
      targetCtx.lineTo(4, TILE_SIZE / 2);
      targetCtx.lineTo(TILE_SIZE - 4, TILE_SIZE / 2);
      targetCtx.closePath();
      targetCtx.fill();
      break;
    case 'D':
      targetCtx.fillRect(TILE_SIZE / 4, TILE_SIZE / 4, TILE_SIZE / 2, TILE_SIZE / 2);
      targetCtx.clearRect(
        TILE_SIZE / 4 + 2,
        TILE_SIZE / 4 + 2,
        TILE_SIZE / 2 - 4,
        TILE_SIZE / 2 - 4
      );
      break;
    default:
  }
  targetCtx.strokeStyle = '#888';
  targetCtx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  targetCtx.restore();
}
