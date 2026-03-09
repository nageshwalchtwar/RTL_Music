# 🎵 RTL Music Jukebox

A shared lab music player — anyone on the network can open the URL, paste a YouTube link, and the music plays through the host PC's speakers.

## Features
- **Drag & drop** YouTube links or paste URLs
- **Shared queue** — everyone sees the same playlist in real-time
- **Controls** — play, pause, skip, previous, remove songs
- **Auto-play** next song when current one ends
- **Mobile friendly** — works on phones too
- **Live user count** — see who's connected

## Quick Start

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the server
npm start
```

The server will print two URLs:
```
🎵  RTL Music Jukebox is running!

   Local:   http://localhost:3000
   Network: http://192.168.x.x:3000

   Share the Network URL with your lab mates!
```

**On your PC (with speakers):** Open `http://localhost:3000` in a browser — this is where audio plays from.

**Lab mates:** Share the `Network URL` — they can add songs from their phones/laptops.

## How to Use
1. Open the web URL in your browser
2. Paste a YouTube link in the input box and click **Add**
3. Or **drag a YouTube link** directly from another tab onto the drop zone
4. Everyone connected sees the shared queue
5. Click any song in the queue to jump to it

## Firewall Note
Make sure port **3000** is open on your PC's firewall so others on the same network can connect.

### Windows
```
netsh advfirewall firewall add rule name="RTL Music" dir=in action=allow protocol=TCP localport=3000
```

### Linux
```
sudo ufw allow 3000
```
