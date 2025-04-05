# P2P Video Calling App

A simple peer-to-peer video calling application using WebRTC. This app allows direct communication between two devices without requiring an external signaling server.

## Features

- Direct peer-to-peer connection using WebRTC
- Video and audio streaming
- Simple role-based connection (host/client)
- Manual exchange of connection details with clipboard support
- Toggle video/audio during the call
- Responsive design

## How to Use

### Option 1: Run with Node.js (recommended)

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Open a terminal/command prompt in the project directory
3. Run the server with: `node server.js`
4. Open `http://localhost:8000` in your browser

### Option 2: Run with Python server

1. Open a terminal/command prompt in the project directory
2. Start a Python HTTP server:
   - Python 3: `python -m http.server 8000`
   - Python 2: `python -m SimpleHTTPServer 8000`
3. Open `http://localhost:8000` in your browser

### Option 3: Use any other web server

Place all files in a directory served by your web server and navigate to that location.

## Step-by-Step Connection Guide

1. **Start the application on both devices**:
   - Grant camera and microphone permissions when prompted
   - Both users will see their camera feed in the local video window

2. **Choose roles**:
   - On the first device, click "Be Host"
   - On the second device, click "Be Client"

3. **Exchange connection information**:
   - The Host will automatically generate an "offer" code
   - The Host should click "Copy to Clipboard" and send this entire code to the Client (via message, email, etc.)
   - The Client pastes this code (using "Paste from Clipboard" or manually) and clicks "Generate Answer"
   - The Client's answer code will appear - click "Copy to Clipboard" and send it to the Host
   - The Host pastes this answer code and clicks "Connect"

4. **During the call**:
   - Both parties should now see each other's video
   - Use the "Toggle Video" button to turn video on/off
   - Use the "Toggle Audio" button to mute/unmute
   - Click "Hang Up" to end the call

## Troubleshooting

- **JSON Parsing Errors**: Make sure you're copying and pasting the entire code without any modifications
- **Empty Video**: Check camera permissions and ensure your browser supports WebRTC
- **Connection Fails**: Both devices might be behind strict NATs or firewalls
- **Offer/Answer Doesn't Work**: Try refreshing the page and starting over

## Browser Compatibility

This app works best on modern browsers that support WebRTC:
- Chrome (recent versions)
- Firefox (recent versions)
- Edge (recent versions)
- Safari (recent versions)

## Network Requirements

- For best results, both devices should be on the same local network
- If on different networks, make sure ports are not blocked by firewalls
- Only uses Google's free STUN server for NAT traversal 