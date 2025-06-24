window.onload = function () {
  const socket = io();
  const gameDisplay = document.getElementById('gameDisplay');
  const commandInput = document.getElementById('commandInput');

  let phase = 'enterName';
  let currentChar = null;
  let newChar = null;

  const savedName = localStorage.getItem('characterName');
  if (savedName) {
    socket.emit('loadCharacter', savedName);
    phase = 'loading';
  }

  function printMessage(msg) {
    if (gameDisplay) {
      gameDisplay.textContent += (msg + '\n');
      gameDisplay.scrollTop = gameDisplay.scrollHeight;
    }
  }

  function rollStat() {
    return (Math.floor(Math.random() * 6) + 1) +
           (Math.floor(Math.random() * 6) + 1) +
           (Math.floor(Math.random() * 6) + 1);
  }

  function generateStats(char) {
    char.str = rollStat();
    char.dex = rollStat();
    char.con = rollStat();
    char.int = rollStat();
    char.wis = rollStat();
    char.cha = rollStat();
  }

  function generateHP(char) {
    let die = 6;
    const cls = (char.class || '').toLowerCase();
    if (cls === 'magic-user' || cls === 'thief') die = 4;
    else if (cls === 'fighter') die = 8;
    char.hp = Math.floor(Math.random() * die) + 1;
  }

  commandInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      const text = commandInput.value.trim();
      commandInput.value = '';
      handleInput(text);
    }
  });

  function handleInput(text) {
    if (!text) return;
    if (phase === 'enterName') {
      newChar = { name: text };
      socket.emit('loadCharacter', text);
      phase = 'loading';
    } else if (phase === 'createClass') {
      newChar.class = text;
      generateStats(newChar);
      generateHP(newChar);
      printMessage(`Stats for ${newChar.name} the ${newChar.class}:`);
      printMessage(`STR ${newChar.str} DEX ${newChar.dex} CON ${newChar.con}`);
      printMessage(`INT ${newChar.int} WIS ${newChar.wis} CHA ${newChar.cha}`);
      printMessage(`HP ${newChar.hp}`);
      printMessage("Type 'yes' to accept or 'no' to reroll stats.");
      phase = 'confirmCharacter';
    } else if (phase === 'confirmCharacter') {
      if (text.toLowerCase() === 'yes') {
        currentChar = newChar;
        socket.emit('saveCharacter', currentChar);
        printMessage(`Created ${currentChar.name} the ${currentChar.class}.`);
        localStorage.setItem('characterName', currentChar.name);
        phase = 'playing';
      } else {
        generateStats(newChar);
        generateHP(newChar);
        printMessage('Rerolled stats:');
        printMessage(`STR ${newChar.str} DEX ${newChar.dex} CON ${newChar.con}`);
        printMessage(`INT ${newChar.int} WIS ${newChar.wis} CHA ${newChar.cha}`);
        printMessage(`HP ${newChar.hp}`);
        printMessage("Type 'yes' to accept or 'no' to reroll stats.");
      }
    } else if (phase === 'playing') {
      printMessage('> ' + text);
      // Placeholder for game commands
    }
  }

  socket.on('characterLoaded', (charData) => {
    currentChar = charData;
    printMessage(`Welcome back, ${charData.name}!`);
    localStorage.setItem('characterName', charData.name);
    phase = 'playing';
  });

  socket.on('characterNotFound', () => {
    localStorage.removeItem('characterName');
    if (!newChar) newChar = { name: '' };
    printMessage(`No character named ${newChar.name}. Choose a class for your new character (Fighter, Cleric, Magic-User, Thief):`);
    phase = 'createClass';
  });

  if (!savedName) {
    printMessage('Enter your character name:');
  } else {
    printMessage(`Loading saved character ${savedName}...`);
  }
  commandInput.focus();
};
