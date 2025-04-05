const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// All routes serve the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Store active users and their connections
const activeUsers = new Map(); // Map of StarLight number -> connection object

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    let userNumber = null;

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data.type);

            switch (data.type) {
                case 'login':
                    handleLogin(ws, data);
                    break;
                case 'call-request':
                    handleCallRequest(ws, data);
                    break;
                case 'call-response':
                    handleCallResponse(ws, data);
                    break;
                case 'ice-candidate':
                    handleIceCandidate(ws, data);
                    break;
                case 'offer':
                    handleOffer(ws, data);
                    break;
                case 'answer':
                    handleAnswer(ws, data);
                    break;
                case 'end-call':
                    handleEndCall(ws, data);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        console.log('WebSocket connection closed');
        if (userNumber) {
            activeUsers.delete(userNumber);
            notifyUserStatusChange(userNumber, false);
        }
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    // Send a message to the client
    function sendToClient(data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    // Handle login
    function handleLogin(ws, data) {
        const { number, name } = data;
        userNumber = number;

        // Check if user is already connected
        if (activeUsers.has(number)) {
            sendToClient({
                type: 'login-response',
                success: false,
                message: 'User already logged in'
            });
            return;
        }

        // Store user connection
        activeUsers.set(number, {
            ws,
            name
        });

        // Notify client of successful login
        sendToClient({
            type: 'login-response',
            success: true
        });

        // Notify other users that this user is online
        notifyUserStatusChange(number, true);
    }

    // Handle call request
    function handleCallRequest(ws, data) {
        const { from, to, withVideo } = data;
        
        // Check if recipient is online
        if (!activeUsers.has(to)) {
            sendToClient({
                type: 'call-response',
                success: false,
                message: 'User is offline'
            });
            return;
        }

        // Forward call request to recipient
        const recipient = activeUsers.get(to);
        recipient.ws.send(JSON.stringify({
            type: 'incoming-call',
            from: from,
            fromName: activeUsers.get(from)?.name || 'Unknown',
            withVideo: withVideo || false
        }));
    }

    // Handle call response
    function handleCallResponse(ws, data) {
        const { from, to, accepted, withVideo } = data;
        
        // Check if caller is online
        if (!activeUsers.has(to)) {
            return;
        }

        // Forward response to caller
        const caller = activeUsers.get(to);
        caller.ws.send(JSON.stringify({
            type: 'call-answered',
            from: from,
            accepted: accepted,
            withVideo: withVideo || false
        }));
    }

    // Handle ICE candidate
    function handleIceCandidate(ws, data) {
        const { candidate, to } = data;
        
        // Check if recipient is online
        if (!activeUsers.has(to)) {
            return;
        }

        // Forward ICE candidate to recipient
        const recipient = activeUsers.get(to);
        recipient.ws.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: candidate,
            from: userNumber
        }));
    }

    // Handle offer
    function handleOffer(ws, data) {
        const { offer, to, withVideo } = data;
        
        // Check if recipient is online
        if (!activeUsers.has(to)) {
            return;
        }

        // Forward offer to recipient
        const recipient = activeUsers.get(to);
        recipient.ws.send(JSON.stringify({
            type: 'offer',
            offer: offer,
            from: userNumber,
            withVideo: withVideo || false
        }));
    }

    // Handle answer
    function handleAnswer(ws, data) {
        const { answer, to, withVideo } = data;
        
        // Check if recipient is online
        if (!activeUsers.has(to)) {
            return;
        }

        // Forward answer to recipient
        const recipient = activeUsers.get(to);
        recipient.ws.send(JSON.stringify({
            type: 'answer',
            answer: answer,
            from: userNumber,
            withVideo: withVideo || false
        }));
    }

    // Handle end call
    function handleEndCall(ws, data) {
        const { to } = data;
        
        // Check if recipient is online
        if (!activeUsers.has(to)) {
            return;
        }

        // Forward end call to recipient
        const recipient = activeUsers.get(to);
        recipient.ws.send(JSON.stringify({
            type: 'end-call',
            from: userNumber
        }));
    }
});

// Notify all users about a user's status change
function notifyUserStatusChange(userNumber, isOnline) {
    for (const [number, user] of activeUsers) {
        if (number !== userNumber) {
            user.ws.send(JSON.stringify({
                type: 'user-status',
                number: userNumber,
                online: isOnline
            }));
        }
    }
}

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
}); 