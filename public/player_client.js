// Basic client for OSE RPG
window.onload = () => {
  const socket = io();
  const display = document.getElementById('gameDisplay');
  const input = document.getElementById('commandInput');

  function print(text) {
    display.textContent += text + '\n';
    display.scrollTop = display.scrollHeight;
  }

  // Show the shared text when we connect
  socket.emit('getSharedText');
  socket.on('sharedText', (text) => {
    print(text);
  });

  print('Enter your character name:');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
      socket.emit('updateSharedText', input.value.trim());
      input.value = '';
    }
  });
};
