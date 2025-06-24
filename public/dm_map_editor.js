
// dm_map_editor.js (Menu-based DM interface)
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

let sharedText = "";
let allCharacters = {};
let state = "menu";
let selectedCharacter = "";

function print(text) {
  output.textContent += "\n" + text;
  output.scrollTop = output.scrollHeight;
}

function clear() {
  output.textContent = "";
}

function showMenu() {
  clear();
  print("DM CONTROL PANEL");
  print("1) View Characters");
  print("2) Hex Map Interface");
  print("3) Shared Campaign Text");
  print("4) Exit to Menu");
  print("\nEnter your choice:");
  state = "menu";
  input.focus();
}

function showCharacterMenu() {
  clear();
  print("CHARACTER LIST:");
  const names = Object.keys(allCharacters);
  if (names.length === 0) {
    print("(No characters found.)");
    showMenu();
    return;
  }
  names.forEach((name, idx) => {
    const ch = allCharacters[name];
    print(`${idx + 1}) ${name} (${ch.class}, ${ch.alignment}, XP: ${ch.xp || 0})`);
  });
  print(`${names.length + 1}) Back to Menu`);
  print("\nChoose a character to delete or return:");
  state = "choose_character";
  input.focus();
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const cmd = input.value.trim();
    input.value = "";
    handleInput(cmd);
  }
});

function handleInput(cmd) {
  if (state === "menu") {
    switch (cmd) {
      case "1":
        socket.emit("loadAllCharacters");
        state = "loading_characters";
        break;
      case "2":
        clear();
        print("Hex Map Interface (canvas coming soon).");
        showMenu();
        break;
      case "3":
        clear();
        print("Shared Campaign Text:");
        print(sharedText);
        print("\nType new shared text:");
        state = "edit_shared_text";
        break;
      case "4":
        showMenu();
        break;
      default:
        print("Invalid choice.");
        showMenu();
    }
  } else if (state === "edit_shared_text") {
    sharedText = cmd;
    socket.emit("updateSharedText", sharedText);
    print("Shared text updated.");
    showMenu();
  } else if (state === "choose_character") {
    const index = parseInt(cmd);
    const names = Object.keys(allCharacters);
    if (index >= 1 && index <= names.length) {
      selectedCharacter = names[index - 1];
      socket.emit("deleteCharacter", selectedCharacter);
      print(`Deleted '${selectedCharacter}'.`);
      showMenu();
    } else if (index === names.length + 1) {
      showMenu();
    } else {
      print("Invalid selection.");
      showCharacterMenu();
    }
  }
}

socket.on("sharedText", (txt) => {
  sharedText = txt;
});

socket.on("allCharacters", (data) => {
  allCharacters = data;
  showCharacterMenu();
});

// Initial fetch
socket.emit("getSharedText");
showMenu();
