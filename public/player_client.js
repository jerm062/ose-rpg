
// player_client.js
const socket = io();

const display = document.getElementById("gameDisplay");

let gameState = "awaiting_name";
let playerName = "";
let character = {
  name: "",
  stats: [],
  class: "",
  alignment: "",
  gold: 0,
  inventory: []
};

const classes = ["Fighter", "Cleric", "Magic-User", "Thief", "Elf", "Dwarf", "Halfling"];
const alignments = ["Lawful", "Neutral", "Chaotic"];
const shopItems = [
  { name: "Torch", cost: 1, description: "Basic light source", classes: [] },
  { name: "Dagger", cost: 3, description: "Light melee weapon", classes: ["Thief", "Magic-User", "Cleric", "Elf", "Halfling"] },
  { name: "Rations (1 week)", cost: 5, description: "Essential food for travel", classes: [] },
  { name: "Backpack", cost: 5, description: "Carry your gear", classes: [] },
  { name: "Rope (50ft)", cost: 1, description: "Climb or tie things", classes: [] },
  { name: "Short Sword", cost: 7, description: "Quick blade", classes: ["Fighter", "Thief", "Elf", "Dwarf"] },
  { name: "Long Sword", cost: 15, description: "Sturdy versatile weapon", classes: ["Fighter", "Elf", "Dwarf"] },
  { name: "Mace", cost: 5, description: "Blunt weapon", classes: ["Cleric", "Fighter"] },
  { name: "Bow", cost: 25, description: "Ranged weapon", classes: ["Fighter", "Elf"] },
  { name: "Quiver with 20 Arrows", cost: 5, description: "Ammo for bows", classes: ["Fighter", "Elf"] },
  { name: "Leather Armor", cost: 20, description: "Light protection", classes: ["Thief", "Magic-User", "Cleric", "Elf", "Halfling"] },
  { name: "Chain Mail", cost: 40, description: "Moderate defense", classes: ["Fighter", "Cleric", "Elf", "Dwarf"] },
  { name: "Plate Mail", cost: 60, description: "Heavy armor", classes: ["Fighter", "Dwarf"] },
  { name: "Shield", cost: 10, description: "Extra protection", classes: ["Fighter", "Cleric", "Elf", "Dwarf"] }
];

function print(text) {
  display.textContent += "\n" + text;
  display.scrollTop = display.scrollHeight;
}

function showPrompt() {
  display.textContent += "\n> ";
  const input = document.getElementById("commandInput");
  input.value = "";
  input.focus();
}

function handleCommand(cmd) {
  if (gameState === "awaiting_name") {
    playerName = cmd.trim();
    character.name = playerName;
    socket.emit("loadCharacter", playerName);
    gameState = "waiting_for_load";
    print(`Checking for saved character...`);
    return;
  }

  if (gameState === "choose_class") {
    const choice = parseInt(cmd.trim());
    if (choice >= 1 && choice <= classes.length) {
      character.class = classes[choice - 1];
      print(`Class set to ${character.class}`);
      print(`\nChoose alignment:`);
      alignments.forEach((a, i) => print(`${i + 1}) ${a}`));
      gameState = "choose_alignment";
    } else {
      print("Invalid class choice.");
    }
    showPrompt();
    return;
  }

  if (gameState === "choose_alignment") {
    const choice = parseInt(cmd.trim());
    if (choice >= 1 && choice <= alignments.length) {
      character.alignment = alignments[choice - 1];
      print(`Alignment set to ${character.alignment}`);
      character.gold = roll3d6() * 10;
      print(`\nYou have ${character.gold}gp. Let's visit the shop.`);
      gameState = "shop";
      listShopItems();
    } else {
      print("Invalid alignment choice.");
    }
    showPrompt();
    return;
  }

  if (gameState === "shop") {
    const choice = parseInt(cmd.trim());
    if (choice === shopItems.length + 1) {
      print("\nYou leave the shop and enter the world...");
      socket.emit("saveCharacter", character);
      gameState = "main_game";
      print("\n(End of character creation for now)");
    } else if (choice >= 1 && choice <= shopItems.length) {
      const item = shopItems[choice - 1];
      if (character.gold >= item.cost) {
        character.gold -= item.cost;
        if (item.classes.length === 0 || item.classes.includes(character.class)) {
          character.inventory.push(item.name);
        } else {
          print(`Your class cannot use ${item.name}.`);
          character.gold += item.cost;
          return;
        }
        print(`You bought: ${item.name}`);
        print(`Gold remaining: ${character.gold}gp`);
        listShopItems();
      } else {
        print("Not enough gold.");
      }
    } else {
      print("Invalid selection.");
    }
    showPrompt();
    return;
  }

  if (gameState === "main_game") {
    print(`Command entered: ${cmd}`);
    showPrompt();
  }
}

function roll3d6() {
  return [0, 0, 0].map(() => Math.floor(Math.random() * 6) + 1).reduce((a, b) => a + b);
}

function listShopItems() {
  print("\nItems for sale:");
  shopItems.forEach((item, i) => print(`${i + 1}) ${item.name} - ${item.cost}gp :: ${item.description}`));
  print(`${shopItems.length + 1}) Finish shopping`);
}

socket.on("characterLoaded", (data) => {
  character = data;
  print(`Welcome back, ${character.name}!`);
  print(`Class: ${character.class}, Gold: ${character.gold}`);
  gameState = "main_game";
  showPrompt();
});

socket.on("characterNotFound", () => {
  print("No saved character found. Let's make one.");
  character.stats = Array.from({ length: 6 }, () => roll3d6());
  print(`Your ability scores:`);
  print(`STR: ${character.stats[0]} DEX: ${character.stats[1]} CON: ${character.stats[2]}`);
  print(`INT: ${character.stats[3]} WIS: ${character.stats[4]} CHA: ${character.stats[5]}`);
  print(`\nChoose your class:`);
  classes.forEach((cls, i) => print(`${i + 1}) ${cls}`));
  gameState = "choose_class";
  showPrompt();
});

// Wrap input handler to ensure DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("commandInput");
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = input.value.trim();
      display.textContent += cmd;
      handleCommand(cmd);
    }
  });
  showPrompt();
});

// Blink cursor effect
setInterval(() => {
  const input = document.getElementById("commandInput");
  if (document.activeElement === input) {
    input.style.borderRight = input.style.borderRight === "2px solid lime" ? "2px solid black" : "2px solid lime";
  }
}, 500);
