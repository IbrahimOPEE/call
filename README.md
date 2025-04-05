# StarLight - Modern Calling App

A sleek, modern calling application built with WebRTC technology for real-time communication.

## Features

- User authentication with email signup
- Unique phone number assignment
- Contacts management
- Call history with recent calls
- Audio and video calling
- Real-time user presence indicators
- WebSocket signaling for direct number-to-number calling
- Modern mobile-friendly UI
- Local storage for user data persistence

## Technology Stack

- HTML5, CSS3, JavaScript
- WebRTC for real-time communication
- WebSocket for signaling and real-time presence
- Express.js for serving the application
- Local storage for data persistence

## Getting Started

### Prerequisites

- Node.js installed on your machine
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/starlight-call.git
   cd starlight-call
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Usage

1. **Sign Up or Log In**:
   - Create a new account with your email and password
   - A unique StarLight number will be assigned to you

2. **Manage Contacts**:
   - Add contacts using the + button on the contacts tab
   - Call contacts directly from the contacts list
   - Online/offline status is shown for each contact

3. **Make Calls**:
   - Use the keypad to dial StarLight numbers
   - Click on contacts to call them
   - Toggle between audio and video calls
   - Calls connect automatically through the signaling server

4. **Receive Calls**:
   - Incoming calls show caller information
   - Accept or decline calls with a tap
   - Caller's name is displayed if they're in your contacts

5. **View Call History**:
   - Check your recent calls in the recents tab
   - See missed, incoming, and outgoing calls
   - Call back directly from the recents list

## Direct Connection

The application now uses WebSocket signaling to enable direct calling using StarLight numbers:

1. **Real-time Presence**:
   - Contacts show online/offline status in real-time
   - Only online users can receive calls

2. **Number-based Calling**:
   - Dial any StarLight number or select from contacts
   - No need to exchange codes manually
   - Calls are routed automatically through the signaling server

3. **Call Flow**:
   - Caller initiates call to recipient's StarLight number
   - Recipient receives notification of incoming call
   - When accepted, WebRTC connection is established automatically
   - Media (audio/video) flows directly between peers

## Demo Features

For demonstration purposes, you can trigger an incoming call simulation:
- Open your browser console and type `simulateIncomingCall()`

## Development

For development with automatic server restart:
```
npm run dev
```

## Deployment

This application requires a hosting service that supports WebSockets:

1. **Render/Railway/DigitalOcean**:
   - These platforms support WebSockets out of the box
   - Deploy as a Node.js application

2. **Heroku**:
   - Follow Heroku's Node.js deployment guide
   - WebSockets are supported on all dynos

NOTE: Simple static hosting services like GitHub Pages won't work because WebSocket support is required.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 