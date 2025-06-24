
// dm_map_editor.js
const socket = io();

const canvas = document.getElementById("hexMap");
const ctx = canvas.getContext("2d");

const deleteInput = document.createElement("input");
deleteInput.placeholder = "Enter player name to delete";
deleteInput.style.margin = "1rem";
deleteInput.style.fontSize = "16px";
deleteInput.style.padding = "0.25rem";
deleteInput.style.border = "1px solid lime";
deleteInput.style.background = "black";
deleteInput.style.color = "lime";
document.body.appendChild(deleteInput);

deleteInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const name = deleteInput.value.trim();
    if (name) {
      socket.emit("deleteCharacter", name);
      alert(`Character '${name}' deletion requested.`);
    }
    deleteInput.value = "";
  }
});

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "lime";
ctx.font = "16px monospace";
ctx.fillText("DM Map Editor Interface Loaded.", 10, 20);
