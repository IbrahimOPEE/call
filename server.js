const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// WebSocket server for signaling
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('./'));

// Active users and their websocket connections
const users = new Map();
// Pending call requests
const pendingCalls = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
    let userId = null;
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message type:', data.type);

            // Handle different message types
            switch (data.type) {
                case 'register':
                    // Register user with name
                    if (data.name && data.name.trim() !== '') {
                        const name = data.name.trim();
                        // Check if name already exists
                        for (const [existingId, user] of users.entries()) {
                            if (user.name === name) {
                                if (user.ws.readyState === WebSocket.OPEN) {
                                    // Name already in use
                                    ws.send(JSON.stringify({
                                        type: 'error',
                                        message: 'Name already in use. Please choose another name.'
                                    }));
                                    return;
                                } else {
                                    // User disconnected, remove them
                                    users.delete(existingId);
                                }
                            }
                        }

                        // Register new user
                        userId = uuidv4();
                        users.set(userId, { name, ws });
                        ws.send(JSON.stringify({
                            type: 'registered',
                            id: userId,
                            message: `Successfully registered as ${name}`
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid name provided'
                        }));
                    }
                    break;

                case 'search':
                    // Search for a user by name
                    if (!userId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'You must register first'
                        }));
                        return;
                    }

                    const searchName = data.name.trim();
                    let found = false;
                    for (const [foundId, user] of users.entries()) {
                        if (user.name === searchName && foundId !== userId) {
                            ws.send(JSON.stringify({
                                type: 'search_result',
                                found: true,
                                name: user.name,
                                id: foundId
                            }));
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        ws.send(JSON.stringify({
                            type: 'search_result',
                            found: false,
                            name: searchName
                        }));
                    }
                    break;

                case 'call_request':
                    // Request a call with target user
                    if (!userId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'You must register first'
                        }));
                        return;
                    }

                    const targetId = data.targetId;
                    const target = users.get(targetId);
                    
                    if (target && target.ws.readyState === WebSocket.OPEN) {
                        // Generate a unique call ID
                        const callId = uuidv4();
                        
                        // Get caller name
                        const caller = users.get(userId);
                        
                        // Save the pending call
                        pendingCalls.set(callId, {
                            callerId: userId,
                            targetId: targetId,
                            status: 'pending',
                            created: Date.now()
                        });
                        
                        // Send call request to target
                        target.ws.send(JSON.stringify({
                            type: 'incoming_call',
                            callId: callId,
                            from: caller.name
                        }));
                        
                        // Confirm to caller that request was sent
                        ws.send(JSON.stringify({
                            type: 'call_requested',
                            callId: callId,
                            message: `Call request sent to ${target.name}`
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'User is not available'
                        }));
                    }
                    break;

                case 'call_response':
                    // Handle response to a call request
                    const callId = data.callId;
                    const accepted = data.accept;
                    
                    if (!callId || !pendingCalls.has(callId)) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid call ID'
                        }));
                        return;
                    }
                    
                    const call = pendingCalls.get(callId);
                    
                    // Make sure this user is the target of the call
                    if (call.targetId !== userId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'You are not authorized to respond to this call'
                        }));
                        return;
                    }
                    
                    const caller = users.get(call.callerId);
                    if (!caller || caller.ws.readyState !== WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Caller is no longer available'
                        }));
                        pendingCalls.delete(callId);
                        return;
                    }
                    
                    if (accepted) {
                        // Call accepted - start WebRTC signaling
                        call.status = 'accepted';
                        
                        // Tell caller their call was accepted
                        caller.ws.send(JSON.stringify({
                            type: 'call_accepted',
                            callId: callId,
                            targetId: userId
                        }));
                        
                        // Tell target the call is connecting
                        ws.send(JSON.stringify({
                            type: 'call_connecting',
                            callId: callId,
                            callerId: call.callerId
                        }));
                    } else {
                        // Call rejected
                        call.status = 'rejected';
                        
                        // Tell caller their call was rejected
                        caller.ws.send(JSON.stringify({
                            type: 'call_rejected',
                            callId: callId,
                            message: 'Call was rejected'
                        }));
                        
                        // Remove the call
                        pendingCalls.delete(callId);
                    }
                    break;

                case 'webrtc_offer':
                    // Forward WebRTC offer to target
                    if (!data.targetId || !data.offer) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid WebRTC offer data'
                        }));
                        return;
                    }
                    
                    const offerTarget = users.get(data.targetId);
                    if (offerTarget && offerTarget.ws.readyState === WebSocket.OPEN) {
                        offerTarget.ws.send(JSON.stringify({
                            type: 'webrtc_offer',
                            offer: data.offer,
                            callerId: userId
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Target user is not available'
                        }));
                    }
                    break;

                case 'webrtc_answer':
                    // Forward WebRTC answer to caller
                    if (!data.callerId || !data.answer) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid WebRTC answer data'
                        }));
                        return;
                    }
                    
                    const answerTarget = users.get(data.callerId);
                    if (answerTarget && answerTarget.ws.readyState === WebSocket.OPEN) {
                        answerTarget.ws.send(JSON.stringify({
                            type: 'webrtc_answer',
                            answer: data.answer,
                            targetId: userId
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Caller is not available'
                        }));
                    }
                    break;

                case 'webrtc_ice_candidate':
                    // Forward ICE candidate to the other peer
                    if (!data.targetId || !data.candidate) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid ICE candidate data'
                        }));
                        return;
                    }
                    
                    const candidateTarget = users.get(data.targetId);
                    if (candidateTarget && candidateTarget.ws.readyState === WebSocket.OPEN) {
                        candidateTarget.ws.send(JSON.stringify({
                            type: 'webrtc_ice_candidate',
                            candidate: data.candidate,
                            from: userId
                        }));
                    }
                    break;

                case 'end_call':
                    // End an ongoing call
                    if (!data.targetId) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid end call data'
                        }));
                        return;
                    }
                    
                    const endCallTarget = users.get(data.targetId);
                    if (endCallTarget && endCallTarget.ws.readyState === WebSocket.OPEN) {
                        endCallTarget.ws.send(JSON.stringify({
                            type: 'call_ended',
                            from: userId
                        }));
                    }
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
            
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        
        // Remove user from active users
        if (userId) {
            users.delete(userId);
            
            // Clean up any pending calls
            for (const [callId, call] of pendingCalls.entries()) {
                if (call.callerId === userId || call.targetId === userId) {
                    // Notify the other party that the call has ended
                    const otherId = call.callerId === userId ? call.targetId : call.callerId;
                    const other = users.get(otherId);
                    
                    if (other && other.ws.readyState === WebSocket.OPEN) {
                        other.ws.send(JSON.stringify({
                            type: 'call_ended',
                            message: 'The other user disconnected',
                            callId
                        }));
                    }
                    
                    pendingCalls.delete(callId);
                }
            }
        }
    });
});

// Clean up expired pending calls every minute
setInterval(() => {
    const now = Date.now();
    for (const [callId, call] of pendingCalls.entries()) {
        // Remove calls older than 60 seconds
        if (call.status === 'pending' && now - call.created > 60000) {
            console.log('Removing expired call request:', callId);
            
            // Notify caller that the call expired
            const caller = users.get(call.callerId);
            if (caller && caller.ws.readyState === WebSocket.OPEN) {
                caller.ws.send(JSON.stringify({
                    type: 'call_expired',
                    callId,
                    message: 'Call request expired'
                }));
            }
            
            pendingCalls.delete(callId);
        }
    }
}, 60000);

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('WebSocket server is ready for signaling');
}); 