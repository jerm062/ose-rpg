OSE RPG Full Bundle

**Setup**
1. Run `npm install` to install dependencies.
2. Start the server with `node server.js`.
3. Visit [http://localhost:3000/player.html](http://localhost:3000/player.html) in your browser.

All user generated content is written under `data/`.
The location can be overridden by setting the `OSE_RPG_DATA_DIR`
environment variable before starting the server. This allows you to keep
campaign files on a separate disk.
Files are organised into persistent folders:

- `data/characters` - saved player characters
- `data/maps` - all map data
- `data/chat` - the running chat log
- `data/lore` - lore entries added during play

These folders make it safe to update the code without losing your campaign files.

Campaign data is automatically exported to the appropriate subfolders whenever it changes.
The GM Data Menu now includes an **Export all** option and players can select
**Export Character** from the main menu to write their character file to
`data/characters`.
The Data Menu also has a **Load all** option to reload characters, maps, lore
and chat logs from the save directory, which can be outside the main project by
setting the `OSE_RPG_DATA_DIR` environment variable.

**GM Map Maker**
- Choose **Map Menu** from the GM interface.
- Select **New map** for a blank map or **Map list** to load one to edit.
- Use the map controls to name and **Save Map**.
- Choose **Share map** to show a saved map to the players.
- Tiles are loaded from the built in tileset and shown in a scrollable grid.
  Click a tile and then a grid cell to place it on the map.
- The `organized_tiles` directory with tile images must exist in the project
  root. Both `server.js` and `public/tiles.js` load tiles from this folder.
  Without these assets the map editor, including Region maps, will display
  blank tiles.

**Lore Book**
- Players can open the lore book from the main menu to view campaign lore.
- The GM can add entries from the GM menu using **Add Lore**.

**Advanced Classes**
The character creator now includes additional options from OSE Advanced
Fantasy such as Assassin, Barbarian, Bard, Druid, Illusionist, Knight,
Paladin and Ranger.
