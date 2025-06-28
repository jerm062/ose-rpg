function applyColors(text) {
  return text
    .replace(/#([\w ]+)/g, '<span class="item">#$1</span>')
    .replace(/\$(\d+)/g, '<span class="gold">$$$1</span>')
    .replace(/@([\w ]+)/g, '<span class="char">@$1</span>')
    .replace(/&([\w ]+)/g, '<span class="location">&$1</span>')
    .replace(/!([\w ]+)/g, '<span class="spell">!$1</span>')
    .replace(/%([\w ]+)/g, '<span class="monster">%$1</span>');
}

function colorize(text) {
  if (text.startsWith('[CHAR]')) return '<span class="gmchar">' + text + '</span>';
  if (text.startsWith('[EVENT]')) return '<span class="gmevent">' + text + '</span>';
  if (text.startsWith('[STORY]')) return '<span class="gmstory">' + text + '</span>';
  return applyColors(text);
}

function colorizePlayerMessage(text) {
  const pm = text.match(/^\[Player:(#[0-9a-fA-F]{6})\]\s+([^:]+):\s*(.*)$/);
  if (!pm) return colorize(text);
  const msg = applyColors(pm[3]);
  return '<span style="color:' + pm[1] + '">' + pm[2] + '</span>: ' + msg;
}

if (typeof module !== 'undefined') {
  module.exports = { colorize, colorizePlayerMessage };
} else {
  window.colorize = colorize;
  window.colorizePlayerMessage = colorizePlayerMessage;
}
