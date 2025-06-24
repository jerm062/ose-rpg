window.onload = function () {
  const socket = io();
  const gameDisplay = document.getElementById('gameDisplay');
  const commandInput = document.getElementById('commandInput');
  const careerButton = document.getElementById('careerButton');
  careerButton.style.display = 'none';

  let phase = 'enterName';
  let currentChar = null;
  let classOptions = classes.slice();

  const classes = [
    'Fighter',
    'Cleric',
    'Magic-User',
    'Thief',
    'Assassin',
    'Barbarian',
    'Bard',
    'Druid',
    'Illusionist',
    'Knight',
    'Paladin',
    'Ranger'
  ];
  const alignments = ['Lawful', 'Neutral', 'Chaotic'];
  const careers = [
    { name: 'Acolyte', items: ['candlestick', 'censer', 'incense'] },
    { name: 'Acrobat', items: ['flash powder', 'balls', 'lamp oil'] },
    { name: 'Actor', items: ['wig', 'makeup', 'costume'] },
    { name: 'Alchemist', items: ['acid', 'mortar/pestle', '6 vials'] },
    { name: 'Antiquarian', items: ['old coin', 'flag', 'lore book'] },
    { name: 'Arcanist', items: ['spell book', 'arcane robes', 'chalk'] },
    { name: 'Architect', items: ['plumb line', 'level', 'ruler'] },
    { name: 'Assassin', items: ['crossbow', 'garrote', 'soft boots'] },
    { name: 'Astrologer', items: ['star charts', 'almanac', 'telescope'] },
    { name: 'Baker', items: ['rolling pin', 'flour bag', 'lard block'] },
    { name: 'Bandit', items: ['mask', 'manacles', 'caltrops'] },
    { name: 'Barber', items: ['scissors', 'hair oil', 'straight razor'] },
    { name: 'Beast Tamer', items: ['whip', 'gloves', 'leash'] },
    { name: 'Beekeeper', items: ['honey', 'mask', 'smoke bomb'] },
    { name: 'Blacksmith', items: ['hammer', 'bellows', 'tongs'] },
    { name: 'Boatman', items: ['10\' pole', 'instrument', 'paddle'] },
    { name: 'Bookbinder', items: ['sewing kit', 'glue', 'quill/ink'] },
    { name: 'Brewer', items: ['mash paddle', 'beer keg', 'hops'] },
    { name: 'Burglar', items: ['lockpicks', 'grappling hook', 'rope'] },
    { name: 'Butcher', items: ['cleaver', 'meat hook', 'bacon'] },
    { name: 'Candlemaker', items: ['10 candles', 'lamp oil', 'wax'] },
    { name: 'Carpenter', items: ['hammer', 'saw', 'box of nails'] },
    { name: 'Charlatan', items: ['costume', 'fake elixir', 'degree'] },
    { name: 'Cobbler', items: ['leather roll', 'fancy shoes', 'tacks'] },
    { name: 'Coachman', items: ['whip', 'lockbox', 'oilskin coat'] },
    { name: 'Cook', items: ['frying pan', 'salt', 'olive oil'] },
    { name: 'Courier', items: ['oilskin bag', 'local map', 'lantern'] },
    { name: 'Courtier', items: ['perfume', 'wig', 'fan'] },
    { name: 'Cultist', items: ['dagger', 'ritual robes', 'amulet'] },
    { name: 'Cutpurse', items: ['knife', 'caltrops', 'sack'] },
    { name: 'Dyer', items: ['10\' pole', 'dyes', 'soap'] },
    { name: 'Explorer', items: ['sextant', 'spyglass', 'crampons'] },
    { name: 'Falconer', items: ['bird cage', 'gloves', 'whistle'] },
    { name: 'Fence', items: ['short sword', 'file', 'sealing wax'] },
    { name: 'Fisherman', items: ['spear', 'net', 'fishing tackle'] },
    { name: 'Folklorist', items: ['prophecy', 'bones', 'scales'] },
    { name: 'Gambler', items: ['rapier', 'card deck', 'dice'] },
    { name: 'Gamekeeper', items: ['sling', 'horn', 'rope ladder'] },
    { name: 'Gardener', items: ['sickle', 'shovel', 'shears'] },
    { name: 'Grave Robber', items: ['saw', 'crowbar', 'pulleys'] },
    { name: 'Gravedigger', items: ['shovel', 'pickaxe', 'bucket'] },
    { name: 'Groom', items: ['oats', 'horse brush', 'blanket'] },
    { name: 'Guard', items: ['halberd', 'livery', 'horn'] },
    { name: 'Headsman', items: ['axe', 'hood', 'garrote'] },
    { name: 'Herbalist', items: ['herbs', 'sickle', 'herb manual'] },
    { name: 'Hermit', items: ['staff', 'fungi', 'basket'] },
    { name: 'Hunter', items: ['tent', 'bearskin', 'bear trap'] },
    { name: 'Innkeeper', items: ['ladle', '10 candles', 'cauldron'] },
    { name: 'Inquisitor', items: ['manual', 'vestments', 'pliers'] },
    { name: 'Investigator', items: ['journal', 'manacles', 'vial'] },
    { name: 'Jailer', items: ['padlock', "10' chain", 'wine jug'] },
    { name: 'Jester', items: ['scepter', 'donkey head', 'motley'] },
    { name: 'Jeweler', items: ['pliers', 'loupe', 'tweezers'] },
    { name: 'Knight', items: ["lady's favor", 'banner', 'signet ring'] },
    { name: 'Kidnapper', items: ['chloroform', 'manacles', 'hood'] },
    { name: 'Lawyer', items: ['fancy robe', 'law book', 'certificate'] },
    { name: 'Locksmith', items: ['crowbar', 'picks', 'padlock'] },
    { name: 'Mason', items: ['chisel', 'hammer', 'chalk'] },
    { name: 'Merchant', items: ['scales', 'strongbox', 'bag of spice'] },
    { name: 'Miner', items: ['pickaxe', 'lantern', 'pet canary'] },
    { name: 'Musician', items: ['3 instruments'] },
    { name: 'Naturalist', items: ['fossil', 'insect case', 'geode'] },
    { name: 'Officer', items: ['shoe polish', 'medal', 'spyglass'] },
    { name: 'Oracle', items: ['tea leaves', 'tarot deck', 'crystal'] },
    { name: 'Orator', items: ['100 marbles', 'bullhorn', 'wax tablet'] },
    { name: 'Painter', items: ['linseed oil', 'pigments', 'brushes'] },
    { name: 'Peddler', items: ['bucket', "300' twine", 'mirror'] },
    { name: 'Philosopher', items: ['staff', 'lantern', 'chalk'] },
    { name: 'Physician', items: ['saw', 'scalpel', 'wine jug'] },
    { name: 'Pilgrim', items: ['staff', 'relic', 'letter of passage'] },
    { name: 'Pirate', items: ['sextant', 'cannonball', 'grappling hook'] },
    { name: 'Pit Fighter', items: ['net', 'whip', 'wine jug'] },
    { name: 'Playwright', items: ['quill/ink', 'skull', '10 candles'] },
    { name: 'Poacher', items: ['animal scent', 'bow', '20 arrows'] },
    { name: 'Poet', items: ['stationery', 'bell', 'perfume'] },
    { name: 'Priest', items: ['holy water', '10 stakes', 'prayer book'] },
    { name: 'Prospector', items: ['10 iron spikes', 'pickaxe', 'pan'] },
    { name: 'Puppeteer', items: ['confetti', 'puppet', 'sewing kit'] },
    { name: 'Rat Catcher', items: ['cage', '10 rat traps', 'sack'] },
    { name: 'Saboteur', items: ['air bladder', 'crowbar', 'bomb'] },
    { name: 'Sailor', items: ['beeswax', 'pullies', 'spyglass'] },
    { name: 'Scout', items: ['signal flags', 'black grease', 'dice'] },
    { name: 'Scribe', items: ['lamp oil', 'quill/ink', 'sealing wax'] },
    { name: 'Sculptor', items: ['chisel', 'clay', 'calipers'] },
    { name: 'Servant', items: ['sponge', 'silverware', 'poker'] },
    { name: 'Shepherd', items: ['crook', 'instrument', 'sling'] },
    { name: 'Shipwright', items: ['drill', 'hammer', 'axe'] },
    { name: 'Singer', items: ['mirror', 'makeup', 'locket'] },
    { name: 'Smuggler', items: ['pulleys', 'rope', 'makeup'] },
    { name: 'Soldier', items: ['tent', 'card deck', 'shovel'] },
    { name: 'Spy', items: ['caltrops', 'poison', 'forged papers'] },
    { name: 'Squire', items: ['torch', 'armor polish', 'trumpet'] },
    { name: 'Tailor', items: ['sewing kit', 'scissors', 'soap'] },
    { name: 'Tattooist', items: ['soot pot', 'needles', '10 candles'] },
    { name: 'Thieftaker', items: ['bear trap', 'manacles', 'torch'] },
    { name: 'Thug', items: ['poison', 'knife', 'lamp oil'] },
    { name: 'Torturer', items: ['drill', 'hourglass', "10' chain"] },
    { name: 'Trapper', items: ['bear trap', "300' twine", 'bear pelt'] },
    { name: 'Watchman', items: ['lantern', 'trumpet', 'spear'] },
    { name: 'Woodcutter', items: ['axe', 'firewood', "50' rope"] }
  ];
  const xpTable = {
    Fighter: [0, 2000, 4000, 8000, 16000, 32000, 64000, 120000, 240000, 360000],
    Cleric: [0, 1500, 3000, 6000, 12000, 24000, 48000, 90000, 180000, 270000],
    'Magic-User': [0, 2500, 5000, 10000, 20000, 40000, 80000, 150000, 300000, 450000],
    Thief: [0, 1200, 2400, 4800, 9600, 20000, 40000, 70000, 110000, 160000],
    Assassin: [0, 1200, 2400, 4800, 9600, 20000, 40000, 70000, 110000, 160000],
    Barbarian: [0, 2000, 4000, 8000, 16000, 32000, 64000, 120000, 240000, 360000],
    Bard: [0, 1200, 2400, 4800, 9600, 20000, 40000, 70000, 110000, 160000],
    Druid: [0, 1500, 3000, 6000, 12000, 24000, 48000, 90000, 180000, 270000],
    Illusionist: [0, 2500, 5000, 10000, 20000, 40000, 80000, 150000, 300000, 450000],
    Knight: [0, 2000, 4000, 8000, 16000, 32000, 64000, 120000, 240000, 360000],
    Paladin: [0, 2000, 4000, 8000, 16000, 32000, 64000, 120000, 240000, 360000],
    Ranger: [0, 2000, 4000, 8000, 16000, 32000, 64000, 120000, 240000, 360000]
  };
  const hitDie = {
    Fighter: 8,
    Cleric: 6,
    'Magic-User': 4,
    Thief: 4,
    Assassin: 4,
    Barbarian: 8,
    Bard: 4,
    Druid: 6,
    Illusionist: 4,
    Knight: 8,
    Paladin: 8,
    Ranger: 8
  };

  const classReqs = {
    Fighter: { STR: 9 },
    Cleric: { WIS: 9 },
    'Magic-User': { INT: 9 },
    Thief: { DEX: 9 },
    Assassin: { STR: 9, DEX: 9 },
    Barbarian: { STR: 9, CON: 9 },
    Bard: { DEX: 9, CHA: 9 },
    Druid: { WIS: 9 },
    Illusionist: { INT: 9 },
    Knight: { STR: 9 },
    Paladin: { STR: 9, CHA: 9 },
    Ranger: { STR: 9, WIS: 9 }
  };
  const gearItems = [
    { name: 'Backpack', cost: 5 },
    { name: 'Bedroll', cost: 1 },
    { name: 'Belladonna', cost: 10 },
    { name: 'Candles (12)', cost: 1 },
    { name: "Chain (10')", cost: 30 },
    { name: 'Chalk', cost: 1 },
    { name: 'Crowbar', cost: 5 },
    { name: 'Flask', cost: 1 },
    { name: 'Garlic', cost: 5 },
    { name: 'Grappling Hook', cost: 25 },
    { name: 'Hammer', cost: 2 },
    { name: 'Holy Symbol', cost: 25 },
    { name: 'Holy Water (vial)', cost: 25 },
    { name: 'Iron Spikes (12)', cost: 1 },
    { name: 'Lantern', cost: 10 },
    { name: 'Mallet', cost: 2 },
    { name: 'Manacles', cost: 15 },
    { name: 'Mirror (small steel)', cost: 5 },
    { name: 'Oil Flask', cost: 2 },
    { name: "Pole (10')", cost: 1 },
    { name: 'Rations (1 day)', cost: 5 },
    { name: 'Rope (50ft)', cost: 10 },
    { name: 'Sack (large)', cost: 1 },
    { name: 'Sack (small)', cost: 1 },
    { name: 'Stakes (3)', cost: 3 },
    { name: 'Tinder Box', cost: 3 },
    { name: 'Torches (6)', cost: 1 },
    { name: 'Waterskin', cost: 1 },
    { name: 'Wine (2 pints)', cost: 1 },
    { name: 'Wolfsbane', cost: 10 }
  ];

  const weaponArmorItems = [
    { name: 'Club', cost: 3, type: 'weapon' },
    { name: 'Dagger', cost: 3, type: 'weapon' },
    { name: 'Hand Axe', cost: 4, type: 'weapon' },
    { name: 'Short Sword', cost: 7, type: 'weapon' },
    { name: 'Sword', cost: 10, type: 'weapon' },
    { name: 'Two-Handed Sword', cost: 15, type: 'weapon' },
    { name: 'Mace', cost: 5, type: 'weapon' },
    { name: 'Flail', cost: 8, type: 'weapon' },
    { name: 'War Hammer', cost: 5, type: 'weapon' },
    { name: 'Spear', cost: 3, type: 'weapon' },
    { name: 'Polearm', cost: 7, type: 'weapon' },
    { name: 'Staff', cost: 2, type: 'weapon' },
    { name: 'Shortbow', cost: 25, type: 'weapon' },
    { name: 'Longbow', cost: 40, type: 'weapon' },
    { name: 'Crossbow', cost: 30, type: 'weapon' },
    { name: 'Sling', cost: 2, type: 'weapon' },
    { name: 'Arrows (20)', cost: 5, type: 'weapon' },
    { name: 'Bolts (30)', cost: 10, type: 'weapon' },
    { name: 'Shield', cost: 10, type: 'armor' },
    { name: 'Leather Armor', cost: 20, type: 'armor' },
    { name: 'Chain Mail', cost: 40, type: 'armor' },
    { name: 'Plate Mail', cost: 60, type: 'armor' },
    { name: 'Spellbook', cost: 50, type: 'gear' }
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
        '9. Lore Book\n' +
        '10. Export Character\n' +
        '(Selecting an option opens a new page)'
    );
    careerButton.style.display = 'none';
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
    printMessage(
      `Active Status: ${(currentChar.status || []).join(', ') || '(none)'}`
    );
    showMenu();
  }

  function showItems() {
    const enc = encumbrance(currentChar);
    const equipped = currentChar.equipped || [];
    const stowed = (currentChar.inventory || []).filter(
      (it) => !equipped.includes(it)
    );
    printMessage(
      'Equipped: ' + equipped.join(', ') +
      '\nStowed: ' + stowed.join(', ') +
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

  careerButton.addEventListener('click', () => {
    if (phase !== 'chooseCareer') return;
    const career = careers[Math.floor(Math.random() * careers.length)];
    currentChar.career = career.name;
    currentChar.inventory.push(...career.items);
    printMessage(`Your career is ${career.name}. You start with: ${career.items.join(', ')}`);
    careerButton.style.display = 'none';
    const hd = hitDie[currentChar.class] || 6;
    currentChar.level = 1;
    currentChar.hp = Math.floor(Math.random() * hd) + 1;
    currentChar.ac = 9;
    currentChar.xp = 0;
    currentChar.nextLevelXP = xpTable[currentChar.class][1];
    const roll = () => Math.floor(Math.random() * 6) + 1;
    currentChar.gold = (roll() + roll() + roll()) * 10;
    printMessage(`You have ${currentChar.gold}gp to spend.`);
    showShopMenu();
    phase = 'shopMenu';
  });

  function handleInput(text) {
    if (!text) return;
    if (phase === 'enterName') {
      socket.emit('loadCharacter', text);
      phase = 'loading';
    } else if (phase === 'newName') {
      currentChar = { name: text, inventory: [], equipped: [] };
      currentChar.stats = {
        STR: rollStat(),
        DEX: rollStat(),
        CON: rollStat(),
        INT: rollStat(),
        WIS: rollStat(),
        CHA: rollStat()
      };
      printMessage(
        `Stats rolled: STR ${currentChar.stats.STR}, DEX ${currentChar.stats.DEX}, CON ${currentChar.stats.CON}, INT ${currentChar.stats.INT}, WIS ${currentChar.stats.WIS}, CHA ${currentChar.stats.CHA}`
      );
      classOptions = classes.filter((c) => {
        const req = classReqs[c] || {};
        return Object.entries(req).every(([k, v]) => currentChar.stats[k] >= v);
      });
      printMessage('Choose a class:');
      classOptions.forEach((c, i) => printMessage(`${i + 1}. ${c}`));
      printMessage('Type the number to select or number followed by A for info.');
      phase = 'chooseClass';
    } else if (phase === 'chooseClass') {
      const infoMatch = text.match(/^(\d+)a$/i);
      if (infoMatch) {
        const i = parseInt(infoMatch[1]) - 1;
        if (classOptions[i]) {
          window.open(`classinfo.html?c=${encodeURIComponent(classOptions[i])}`, '_blank');
        } else {
          printMessage('Invalid choice.');
        }
        return;
      }
      const idx = parseInt(text) - 1;
      if (classOptions[idx]) {
        currentChar.class = classOptions[idx];
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
        printMessage('Click the Roll Career button to get your career.');
        careerButton.style.display = 'inline-block';
        phase = 'chooseCareer';
      } else {
        printMessage('Invalid choice.');
      }
    } else if (phase === 'shopMenu') {
      if (text === '1') {
        showShop();
      } else if (text === '2') {
        showWeapons();
      } else if (text === '0') {
        if (currentChar.class === 'Magic-User') {
          printMessage('Choose a starting spell:');
          spells.forEach((s, i) => printMessage(`${i + 1}. ${s}`));
          phase = 'spellSelect';
        } else {
          finalizeCharacter();
        }
      } else {
        printMessage('Invalid choice.');
      }
    } else if (phase === 'shopGear') {
      if (text === '0') {
        showShopMenu();
        phase = 'shopMenu';
        return;
      }
      const idx = parseInt(text) - 1;
      const item = gearItems[idx];
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
    } else if (phase === 'shopWeapons') {
      if (text === '0') {
        showShopMenu();
        phase = 'shopMenu';
        return;
      }
      const list = weaponArmorItems.filter((it) => canUseItem(it));
      const idx = parseInt(text) - 1;
      const item = list[idx];
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
        case '9':
          window.location.href = 'lore.html';
          break;
        case '10':
          socket.emit('exportCharacter', currentChar.name);
          printMessage('Character exported.');
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
    printMessage('Adventuring Gear - enter number to buy, or 0 to return:');
    gearItems.forEach((it, i) =>
      printMessage(`${i + 1}. ${it.name} (${it.cost}gp)`)
    );
    phase = 'shopGear';
  }

  function showWeapons() {
    const list = weaponArmorItems.filter((it) => canUseItem(it));
    printMessage('Weapons & Armor - enter number to buy, or 0 to return:');
    list.forEach((it, i) =>
      printMessage(`${i + 1}. ${it.name} (${it.cost}gp)`)
    );
    phase = 'shopWeapons';
  }

  function showShopMenu() {
    printMessage('Shop Menu:\n1. Adventuring Gear\n2. Weapons & Armor\n0. Finish');
  }

  function canUseItem(it) {
    const cls = currentChar.class;
    if (it.type === 'armor') {
      if (cls === 'Magic-User') return false;
      if ((cls === 'Thief' || cls === 'Assassin') && it.name === 'Plate Mail') return false;
      return true;
    }
    if (it.type === 'weapon') {
      if (cls === 'Magic-User') return ['Dagger', 'Staff'].includes(it.name);
      if (cls === 'Cleric') {
        const allowed = ['Mace', 'War Hammer', 'Flail', 'Staff', 'Club', 'Sling'];
        return allowed.includes(it.name);
      }
    }
    return true;
  }

  function finalizeCharacter() {
    socket.emit('saveCharacter', currentChar);
    printMessage('Character creation complete!');
    phase = 'loading';
  }

  socket.on('characterLoaded', (charData) => {
    currentChar = charData;
    currentChar.equipped = currentChar.equipped || [];
    currentChar.status = currentChar.status || [];
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
