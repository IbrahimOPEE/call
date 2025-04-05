# StarLight - Modern Calling App

A sleek, modern calling application built with WebRTC technology for real-time communication.

## Features

- User authentication with email signup
- Unique phone number assignment
- Contacts management
- Call history with recent calls
- Audio and video calling
- Modern mobile-friendly UI
- Local storage for user data persistence

## Technology Stack

- HTML5, CSS3, JavaScript
- WebRTC for real-time communication
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

3. **Make Calls**:
   - Use the keypad to dial numbers
   - Click on contacts to call them
   - Toggle between audio and video calls

4. **View Call History**:
   - Check your recent calls in the recents tab
   - See missed, incoming, and outgoing calls

## Demo Features

For demonstration purposes, you can trigger an incoming call simulation:
- Open your browser console and type `simulateIncomingCall()`

## Development

For development with automatic server restart:
```
npm run dev
```

## Deployment

This application can be deployed to any static hosting service or Node.js platform:

1. **Vercel/Netlify**:
   - Connect your GitHub repository
   - Set the build command to `npm install`
   - Set the output directory to `.`
   - Set the start command to `npm start`

2. **Heroku**:
   - Follow Heroku's Node.js deployment guide
   - The app is ready to deploy as is

## License

This project is licensed under the MIT License - see the LICENSE file for details. 