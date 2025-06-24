
// player_client.js
const socket = io();
...
// Blink cursor effect
setInterval(() => {
  if (document.activeElement === input) {
    input.style.borderRight = input.style.borderRight === "2px solid lime" ? "2px solid black" : "2px solid lime";
  }
}, 500);
