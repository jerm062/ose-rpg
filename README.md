OSE RPG Full Bundle

**Setup**
1. Run `npm install` to install dependencies.
2. Start the server with `node server.js`.
3. Visit [http://localhost:3000/player.html](http://localhost:3000/player.html) in your browser.

You can override where campaign data is saved by setting the `DATA_DIR`
environment variable. This is handy when pointing the server at a persistent
Render disk.

All user generated content is written under `data/`.
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
The server also writes all data to disk every few minutes and when it receives a
shutdown signal.

**GM Map Maker**
- Choose **Map Menu** from the GM interface.
- Select **New map** for a blank map or **Map list** to load one to edit.
- Use the map controls to name and **Save Map**.
- Choose **Share map** to show a saved map to the players.
- Tiles are loaded from the `/icons` directory and shown in a scrollable grid.
  Click an icon and then a grid cell to place it on the map.

**Lore Book**
- Players can open the lore book from the main menu to view campaign lore.
- The GM can add entries from the GM menu using **Add Lore**.

**Advanced Classes**
The character creator now includes additional options from OSE Advanced
Fantasy such as Assassin, Barbarian, Bard, Druid, Illusionist, Knight,
Paladin and Ranger.
