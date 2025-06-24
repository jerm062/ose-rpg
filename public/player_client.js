window.onload = function () {
  const socket = io();
  const gameDisplay = document.getElementById('gameDisplay');
  const commandInput = document.getElementById('commandInput');

  let phase = 'enterName';
  let currentChar = null;

  function printMessage(msg) {
    if (gameDisplay) {
      gameDisplay.textContent += (msg + '\n');
      gameDisplay.scrollTop = gameDisplay.scrollHeight;
    }
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
      socket.emit('loadCharacter', text);
      phase = 'loading';
    } else if (phase === 'createCharacter') {
      currentChar = { name: text };
      socket.emit('saveCharacter', currentChar);
      printMessage(`Created new character ${text}.`);
      phase = 'playing';
    } else if (phase === 'playing') {
      printMessage('> ' + text);
      // Placeholder for game commands
    }
  }

  socket.on('characterLoaded', (charData) => {
    currentChar = charData;
    printMessage(`Welcome back, ${charData.name}!`);
    phase = 'playing';
  });

  socket.on('characterNotFound', () => {
    printMessage('No character found. Enter a new name to create one:');
    phase = 'createCharacter';
  });

  printMessage('Enter your character name:');
  commandInput.focus();
};
