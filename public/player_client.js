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
  const xpTable = {
    Fighter: [0, 2000, 4000, 8000, 16000, 32000, 64000, 120000, 240000, 360000],
    Cleric: [0, 1500, 3000, 6000, 12000, 24000, 48000, 90000, 180000, 270000],
    'Magic-User': [0, 2500, 5000, 10000, 20000, 40000, 80000, 150000, 300000, 450000],
    Thief: [0, 1200, 2400, 4800, 9600, 20000, 40000, 70000, 110000, 160000]
  };
  const hitDie = { Fighter: 8, Cleric: 6, 'Magic-User': 4, Thief: 4 };
  const shopItems = [
    // Adventuring gear
    { name: 'Rations (1 day)', cost: 5 },
    { name: 'Torch', cost: 1 },
    { name: 'Rope (50ft)', cost: 10 },
    { name: 'Lantern', cost: 10 },
    { name: 'Oil Flask', cost: 2 },
    { name: 'Backpack', cost: 5 },
    { name: 'Waterskin', cost: 1 },
    { name: 'Bedroll', cost: 5 },
    { name: 'Grappling Hook', cost: 25 },
    { name: 'Hammer & Spikes', cost: 3 },
    { name: 'Mirror (small)', cost: 5 },
    { name: 'Flint & Steel', cost: 2 },
    // Weapons
    { name: 'Dagger', cost: 10 },
    { name: 'Short Sword', cost: 30 },
    { name: 'Long Sword', cost: 50 },
    { name: 'Mace', cost: 15 },
    { name: 'Spear', cost: 10 },
    { name: 'Bow', cost: 40 },
    { name: 'Arrows (20)', cost: 5 },
    // Armor
    { name: 'Shield', cost: 10 },
    { name: 'Leather Armor', cost: 20 },
    { name: 'Chain Mail', cost: 40 },
    { name: 'Plate Mail', cost: 60 },
    { name: 'Spellbook', cost: 50 }
  ];
  const spells = ['Magic Missile', 'Shield', 'Sleep', 'Light', 'Charm Person'];

  function rollStat() {
    const d6 = () => Math.floor(Math.random() * 6) + 1;
    return d6() + d6() + d6();
  }

  function encumbrance(char) {
    let slots = (char.inventory || []).length;
    const coins = char.gold || 0;
    slots += Math.ceil(coins / 100);
    if (char.inventory.includes('Plate Mail')) slots += 5;
    if (char.inventory.includes('Chain Mail')) slots += 4;
    if (char.inventory.includes('Leather Armor')) slots += 2;
    if (char.inventory.includes('Shield')) slots += 1;

    let mv;
    if (slots <= 5) mv = '120\'';
    else if (slots <= 10) mv = '90\'';
    else if (slots <= 15) mv = '60\'';
    else mv = '30\'';
    return { slots, mv };
  }

  function showMenu() {
    printMessage(
      'Main Menu\n' +
        '1. Character Sheet\n' +
        '2. Items\n' +
        '3. Map\n' +
        '4. Chat\n' +
        '5. Journal\n' +
        '6. Help\n' +
        '7. Spells\n' +
        '8. Save Character\n' +
        '(Selecting an option opens a new page)'
    );
    phase = 'menu';
  }

  function showHelp() {
    printMessage(
      'Commands:\n' +
        '#item - use item from inventory\n' +
        '$N - spend N gold\n' +
        '/ready or /unready - toggle ready status\n' +
        '/roll XdY(+N) - roll dice in chat'
    );
    printMessage('0. Return');
    phase = 'help';
  }

  function showCharacterSheet() {
    const s = currentChar.stats || {};
    printMessage(
      `Career: ${currentChar.career}`
    );
    printMessage(
      `STR:${s.STR} DEX:${s.DEX} CON:${s.CON} INT:${s.INT} WIS:${s.WIS} CHA:${s.CHA}`
    );
    printMessage(
      `Level:${currentChar.level} HP:${currentChar.hp} AC:${currentChar.ac} XP:${currentChar.xp}/${currentChar.nextLevelXP}`
    );
    showMenu();
  }

  function showItems() {
    const enc = encumbrance(currentChar);
    printMessage(
      'Items: ' + (currentChar.inventory || []).join(', ') +
      `\nGold: ${currentChar.gold || 0}\nENC:${enc.slots} MV:${enc.mv}`
    );
    showMenu();
  }

  function printMap(data) {
    printMessage(data.map((row) => row.join('')).join('\n'));
    printMessage('0. Return');
  }

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
        currentChar.stats = {
          STR: rollStat(),
          DEX: rollStat(),
          CON: rollStat(),
          INT: rollStat(),
          WIS: rollStat(),
          CHA: rollStat()
        };
        const hd = hitDie[currentChar.class] || 6;
        currentChar.level = 1;
        currentChar.hp = Math.floor(Math.random() * hd) + 1;
        currentChar.ac = 9;
        currentChar.xp = 0;
        currentChar.nextLevelXP = xpTable[currentChar.class][1];
        const roll = () => Math.floor(Math.random() * 6) + 1;
        currentChar.gold = (roll() + roll() + roll()) * 10;
        printMessage(`Stats rolled: STR ${currentChar.stats.STR}, DEX ${currentChar.stats.DEX}, CON ${currentChar.stats.CON}, INT ${currentChar.stats.INT}, WIS ${currentChar.stats.WIS}, CHA ${currentChar.stats.CHA}`);
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
    } else if (phase === 'menu') {
      switch (text) {
        case '1':
          window.location.href = 'character.html';
          break;
        case '2':
          window.location.href = 'items.html';
          break;
        case '3':
          window.location.href = 'map.html';
          break;
        case '4':
          window.location.href = 'chat.html';
          break;
        case '5':
          window.location.href = 'journal.html';
          break;
        case '6':
          showHelp();
          break;
        case '7':
          window.location.href = 'spells.html';
          break;
        case '8':
          socket.emit('saveCharacter', currentChar);
          printMessage('Character saved.');
          break;
        default:
          printMessage('Invalid choice.');
      }
    } else if (phase === 'chat') {
      if (text === '0') {
        showMenu();
      } else {
        socket.emit('playerMessage', { name: currentChar.name, message: text });
      }
    } else if (phase === 'map') {
      if (text === '0') {
        showMenu();
      }
    } else if (phase === 'journal') {
      if (text === '0') {
        showMenu();
      }
    } else if (phase === 'help') {
      if (text === '0') {
        showMenu();
      }
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
    socket.emit('registerPlayer', charData.name);
    showMenu();
  });

  socket.on('characterNotFound', () => {
    localStorage.removeItem('characterName');
    printMessage('No character found. Enter a new name to create one:');
    phase = 'newName';
  });

  socket.on('logUpdate', (entry) => {
    printMessage(entry);
  });

  socket.on('mapData', (data) => {
    if (phase === 'map') {
      printMap(data);
    }
  });

  socket.on('campaignLog', (log) => {
    if (phase === 'journal') {
      printMessage(log.join('\n'));
      printMessage('0. Return');
    }
  });

  if (!savedName) {
    printMessage('Enter your character name:');
  } else {
    printMessage(`Loading saved character ${savedName}...`);
  }
  commandInput.focus();
};
