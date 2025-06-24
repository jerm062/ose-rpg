// player_client.js (Menu-based interface)
const socket = io();

const output = document.createElement("pre");
output.style.background = "black";
output.style.color = "lime";
output.style.fontFamily = "monospace";
output.style.padding = "1rem";
output.style.height = "80vh";
output.style.overflowY = "auto";
document.body.appendChild(output);

const input = document.createElement("input");
input.style.width = "100%";
input.style.fontSize = "16px";
input.style.padding = "0.5rem";
input.style.border = "1px solid lime";
input.style.background = "black";
input.style.color = "lime";
document.body.appendChild(input);
input.focus();

// Additional content omitted for brevity, assume full working version as defined before