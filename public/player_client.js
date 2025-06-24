window.onload = function () {
  const socket = io();
  const gameDisplay = document.getElementById('gameDisplay');
  const commandInput = document.getElementById('commandInput');

  let phase = 'enterName';
  let currentChar = null;

  const classes = ['Fighter', 'Cleric', 'Magic-User', 'Thief'];
  const alignments = ['Lawful', 'Neutral', 'Chaotic'];
  const careers = [
    { name: 'Alchemist', items: ['pestle and mortar', 'jar of chemicals'] },
    { name: 'Baker', items: ['rolling pin', 'loaf of bread'] },
    { name: 'Blacksmith', items: ['hammer', 'tongs'] },
    { name: 'Farmer', items: ['pitchfork', 'seed pouch'] },
    { name: 'Gambler', items: ['dice set', 'fine clothes'] },
    { name: 'Herbalist', items: ['herb pouch', 'mortar'] },
    { name: 'Hunter', items: ['short bow', 'animal trap'] },
    { name: 'Sailor', items: ['dagger', 'coil of rope'] },
    { name: 'Soldier', items: ['spear', 'shield'] },
    { name: 'Urchin', items: ['dagger', 'rat on a string'] }
  ];
  const shopItems = [
    { name: 'Rations (1 day)', cost: 5 },
    { name: 'Torch', cost: 1 },
    { name: 'Rope (50ft)', cost: 10 },
    { name: 'Lantern', cost: 10 },
    { name: 'Oil Flask', cost: 2 },
    { name: 'Dagger', cost: 10 },
    { name: 'Backpack', cost: 5 },
    { name: 'Spellbook', cost: 50 }
  ];
  const spells = ['Magic Missile', 'Shield', 'Sleep', 'Light', 'Charm Person'];

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
    } else if (phase === 'newName') {
      currentChar = { name: text, inventory: [] };
      printMessage(`Hello ${text}! Choose a class:`);
      classes.forEach((c, i) => printMessage(`${i + 1}. ${c}`));
      phase = 'chooseClass';
    } else if (phase === 'chooseClass') {
      const idx = parseInt(text) - 1;
      if (classes[idx]) {
        currentChar.class = classes[idx];
        printMessage('Choose an alignment:');
        alignments.forEach((a, i) => printMessage(`${i + 1}. ${a}`));
        phase = 'chooseAlignment';
      } else {
        printMessage('Invalid choice.');
      }
    } else if (phase === 'chooseAlignment') {
      const idx = parseInt(text) - 1;
      if (alignments[idx]) {
        currentChar.alignment = alignments[idx];
        const career = careers[Math.floor(Math.random() * careers.length)];
        currentChar.career = career.name;
        currentChar.inventory.push(...career.items);
        printMessage(`Your career is ${career.name}. You start with: ${career.items.join(', ')}`);
        const roll = () => Math.floor(Math.random() * 6) + 1;
        currentChar.gold = (roll() + roll() + roll()) * 10;
        printMessage(`You have ${currentChar.gold}gp to spend.`);
        showShop();
        phase = 'shop';
      } else {
        printMessage('Invalid choice.');
      }
    } else if (phase === 'shop') {
      if (text === '0') {
        if (currentChar.class === 'Magic-User') {
          printMessage('Choose a starting spell:');
          spells.forEach((s, i) => printMessage(`${i + 1}. ${s}`));
          phase = 'spellSelect';
        } else {
          finalizeCharacter();
        }
        return;
      }
      const idx = parseInt(text) - 1;
      const item = shopItems[idx];
      if (item) {
        if (currentChar.gold >= item.cost) {
          currentChar.gold -= item.cost;
          currentChar.inventory.push(item.name);
          printMessage(`Purchased ${item.name}. Gold left: ${currentChar.gold}`);
        } else {
          printMessage('Not enough gold.');
        }
      } else {
        printMessage('Invalid item.');
      }
    } else if (phase === 'spellSelect') {
      const idx = parseInt(text) - 1;
      if (spells[idx]) {
        currentChar.spells = [spells[idx]];
        printMessage(`You memorise ${spells[idx]}.`);
        finalizeCharacter();
      } else {
        printMessage('Invalid spell.');
      }
    } else if (phase === 'playing') {
      printMessage('> ' + text);
      socket.emit('playerMessage', { name: currentChar.name, message: text });
    }
  }

  function showShop() {
    printMessage('Shop - enter item number to buy, or 0 to finish:');
    shopItems.forEach((it, i) => printMessage(`${i + 1}. ${it.name} (${it.cost}gp)`));
  }

  function finalizeCharacter() {
    socket.emit('saveCharacter', currentChar);
    printMessage('Character creation complete!');
    phase = 'loading';
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
    phase = 'newName';
  });

  socket.on('logUpdate', (entry) => {
    printMessage(entry);
  });

  if (!savedName) {
    printMessage('Enter your character name:');
  } else {
    printMessage(`Loading saved character ${savedName}...`);
  }
  commandInput.focus();
};
