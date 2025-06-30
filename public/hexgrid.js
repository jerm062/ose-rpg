(function() {
  const canvas = document.getElementById('hexCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const radius = 20;
  const hexH = Math.sqrt(3) * radius;
  const cols = Math.floor(canvas.width / (radius * 1.5));
  const rows = Math.floor(canvas.height / hexH);

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

  for (let q = 0; q < cols; q++) {
    for (let r = 0; r < rows; r++) {
      const cx = radius * 1.5 * q + radius;
      const cy = hexH * (r + 0.5 * (q % 2)) + radius;
      drawHex(cx, cy);
    }
  }
})();
