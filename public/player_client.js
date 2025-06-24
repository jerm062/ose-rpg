window.onload = function () {
  const socket = io();
  const gameDisplay = document.getElementById('gameDisplay');
  const commandInput = document.getElementById('commandInput');

  let phase = 'enterName';
  let currentChar = null;

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
      localStorage.setItem('characterName', currentChar.name);
      phase = 'playing';
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
    printMessage('No character found. Enter a new name to create one:');
    phase = 'createCharacter';
  });

  if (!savedName) {
    printMessage('Enter your character name:');
  } else {
    printMessage(`Loading saved character ${savedName}...`);
  }
  commandInput.focus();
};
