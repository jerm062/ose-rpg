
// player_client.js (Clean single input)
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
input.id = "terminalInput";
input.style.width = "100%";
input.style.fontSize = "16px";
input.style.padding = "0.5rem";
input.style.border = "1px solid lime";
input.style.background = "black";
input.style.color = "lime";
document.body.appendChild(input);
input.focus();

let gameState = "awaiting_name";
let playerName = "";
let sharedText = "";
let character = {
  name: "",
  stats: [],
  class: "",
  alignment: "",
  xp: 0,
  gold: 0,
  inventory: [],
  spells: [],
  bio: "",
  background: ""
};

function print(text) {
  output.textContent += "\n" + text;
  output.scrollTop = output.scrollHeight;
}

function clear() {
  output.textContent = "";
}

function showMenu() {
  clear();
  print(`Welcome ${character.name}!`);
  print("1) View Character Sheet");
  print("2) Inventory & Spells");
  print("3) Campaign Notes");
  print("4) Map View (coming soon)");
  print("5) Exit to Menu");
  print("\nEnter your choice:");
  gameState = "menu";
  input.focus();
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const cmd = input.value.trim();
    input.value = "";
    handleCommand(cmd);
  }
});

function handleCommand(cmd) {
  if (gameState === "choose_class") {
    const choice = parseInt(cmd.trim());
    const classes = ["Fighter", "Cleric", "Magic-User", "Thief", "Elf", "Dwarf", "Halfling"];
    if (choice >= 1 && choice <= classes.length) {
      character.class = classes[choice - 1];
      print(`Class set to ${character.class}`);
      showMenu();
    } else {
      print("Invalid class choice. Try again.");
    }
    return;
  }
  if (gameState === "awaiting_name" && cmd.toLowerCase() === 'b') {
    character.background = rollCareer();
    const parts = character.background.split(':');
    if (parts.length > 1) {
      const items = parts[1].split(',').map(i => i.trim());
      character.inventory.push(...items);
    }
    print(`\nBackground generated:\n${character.background}`);
    print("\nEnter your character name:");
    return;
  }
  if (gameState === "awaiting_name") {
    playerName = cmd;
    character.name = playerName;
    socket.emit("loadCharacter", playerName);
    gameState = "waiting_for_load";
    print("Checking for saved character...");
    print("\n(Press B for random background career.)");
    return;
  }
  if (gameState === "menu") {
    switch (cmd) {
      case "1":
        clear();
        print("CHARACTER SHEET");
        print(`Class: ${character.class}`);
        if (character.background) print(`Background: ${character.background.split(':')[0]}`);
        print(`Alignment: ${character.alignment}`);
        print(`XP: ${character.xp || 0}`);
        print(`Gold: ${character.gold}`);
        print(`Stats: STR ${character.stats[0]} DEX ${character.stats[1]} CON ${character.stats[2]} INT ${character.stats[3]} WIS ${character.stats[4]} CHA ${character.stats[5]}`);
        print("\nEnter to return.");
        gameState = "pause";
        break;
      case "2":
        clear();
        print("INVENTORY & SPELLS");
        print(`Items: ${character.inventory.join(", ") || "None"}`);
        print(`Spells: ${character.spells.join(", ") || "None"}`);
        print(`Bio: ${character.bio || "(none)"}`);
        print("\nEnter to return.");
        gameState = "pause";
        break;
      case "3":
        clear();
        print("CAMPAIGN NOTES:");
        print(sharedText);
        print("\nEnter to return.");
        gameState = "pause";
        break;
      case "4":
        clear();
        print("Map view coming soon.");
        showMenu();
        break;
      case "5":
        showMenu();
        break;
      default:
        print("Invalid selection.");
        showMenu();
    }
  } else if (gameState === "pause") {
    showMenu();
  }
}

function roll3d6() {
  return Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
}

function rollCareer() {
  const careers = ["acolyte: candlestick, censer, incense", "acrobat: flash powder, balls, lamp oil", "actor: wig, makeup, costume", "woodcutter: axe, firewood, 50’ rope"];
  const roll = Math.floor(Math.random() * careers.length);
  return careers[roll];
}

socket.on("characterLoaded", (data) => {
  character = data;
  print(`Welcome back, ${character.name}!`);
  socket.emit("getSharedText");
  showMenu();
});

socket.on("characterNotFound", () => {
  print("No saved character found. Starting new character...");
  character.stats = Array.from({ length: 6 }, () => roll3d6());
  print(`Your ability scores:`);
  print(`STR: ${character.stats[0]} DEX: ${character.stats[1]} CON: ${character.stats[2]}`);
  print(`INT: ${character.stats[3]} WIS: ${character.stats[4]} CHA: ${character.stats[5]}`);
  print("\nChoose your class:");
  const classes = ["Fighter", "Cleric", "Magic-User", "Thief", "Elf", "Dwarf", "Halfling"];
  classes.forEach((cls, i) => print(`${i + 1}) ${cls}`));
  gameState = "choose_class";
});

socket.on("sharedText", (text) => {
  sharedText = text;
});

print("Enter your character name:");
