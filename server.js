const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Shared state
let queue = [];        // { id, title, videoId, addedBy }
let currentIndex = -1; // index of currently playing song
let isPlaying = false;
let connectedUsers = 0;

// Extract YouTube video ID from various URL formats
function extractVideoId(input) {
  input = input.trim();
  // Direct video ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  try {
    const url = new URL(input);
    // youtube.com/watch?v=...
    if (url.hostname.includes('youtube.com') && url.searchParams.get('v')) {
      return url.searchParams.get('v');
    }
    // youtu.be/VIDEO_ID
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1).split('/')[0];
    }
    // youtube.com/embed/VIDEO_ID
    if (url.pathname.startsWith('/embed/')) {
      return url.pathname.split('/')[2];
    }
    // youtube.com/shorts/VIDEO_ID
    if (url.pathname.startsWith('/shorts/')) {
      return url.pathname.split('/')[2];
    }
  } catch (e) {
    // not a valid URL
  }
  return null;
}

io.on('connection', (socket) => {
  connectedUsers++;
  io.emit('users', connectedUsers);

  // Send current state to newly connected client
  socket.emit('state', { queue, currentIndex, isPlaying });

  // User adds a song
  socket.on('addSong', (data) => {
    const videoId = extractVideoId(data.url);
    if (!videoId) {
      socket.emit('error', 'Invalid YouTube URL');
      return;
    }
    const song = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      videoId,
      title: data.title || 'Loading...',
      addedBy: data.addedBy || 'Anonymous'
    };
    queue.push(song);

    // If nothing is playing, start this song
    if (currentIndex === -1) {
      currentIndex = 0;
      isPlaying = true;
    }

    io.emit('state', { queue, currentIndex, isPlaying });
  });

  // Update song title (once iframe loads and we get the title)
  socket.on('updateTitle', (data) => {
    const song = queue.find(s => s.id === data.id);
    if (song) {
      song.title = data.title;
      io.emit('state', { queue, currentIndex, isPlaying });
    }
  });

  // Play / Pause
  socket.on('togglePlay', () => {
    isPlaying = !isPlaying;
    io.emit('state', { queue, currentIndex, isPlaying });
  });

  // Next song
  socket.on('next', () => {
    if (currentIndex < queue.length - 1) {
      currentIndex++;
      isPlaying = true;
      io.emit('state', { queue, currentIndex, isPlaying });
    }
  });

  // Previous song
  socket.on('prev', () => {
    if (currentIndex > 0) {
      currentIndex--;
      isPlaying = true;
      io.emit('state', { queue, currentIndex, isPlaying });
    }
  });

  // Jump to specific song
  socket.on('playSong', (index) => {
    if (index >= 0 && index < queue.length) {
      currentIndex = index;
      isPlaying = true;
      io.emit('state', { queue, currentIndex, isPlaying });
    }
  });

  // Remove a song
  socket.on('removeSong', (index) => {
    if (index >= 0 && index < queue.length) {
      queue.splice(index, 1);
      if (queue.length === 0) {
        currentIndex = -1;
        isPlaying = false;
      } else if (index <= currentIndex) {
        currentIndex = Math.max(0, currentIndex - 1);
      }
      io.emit('state', { queue, currentIndex, isPlaying });
    }
  });

  // Clear queue
  socket.on('clearQueue', () => {
    queue = [];
    currentIndex = -1;
    isPlaying = false;
    io.emit('state', { queue, currentIndex, isPlaying });
  });

  // Song ended - auto play next
  socket.on('songEnded', () => {
    if (currentIndex < queue.length - 1) {
      currentIndex++;
      isPlaying = true;
    } else {
      isPlaying = false;
    }
    io.emit('state', { queue, currentIndex, isPlaying });
  });

  socket.on('disconnect', () => {
    connectedUsers--;
    io.emit('users', connectedUsers);
  });
});

// Get local IP for sharing
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('');
  console.log('🎵  RTL Music Jukebox is running!');
  console.log('');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${ip}:${PORT}`);
  console.log('');
  console.log('   Share the Network URL with your lab mates!');
  console.log('   Open it on the PC with speakers to hear music.');
  console.log('');
});
