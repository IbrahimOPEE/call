// DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const videoContainer = document.getElementById('videoContainer');
const callControls = document.getElementById('callControls');
const hangupBtn = document.getElementById('hangupBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const statusMessage = document.getElementById('statusMessage');
const cameraStatus = document.getElementById('cameraStatus');
const micStatus = document.getElementById('micStatus');
const compatWarning = document.getElementById('compatWarning');
const dismissWarning = document.getElementById('dismissWarning');

// Login elements
const loginScreen = document.getElementById('loginScreen');
const username = document.getElementById('username');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');

// Dashboard elements
const callDashboard = document.getElementById('callDashboard');
const userDisplayName = document.getElementById('userDisplayName');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResult = document.getElementById('searchResult');
const callBtn = document.getElementById('callBtn');

// Call notification elements
const callNotification = document.getElementById('callNotification');
const callerName = document.getElementById('callerName');
const acceptCallBtn = document.getElementById('acceptCallBtn');
const rejectCallBtn = document.getElementById('rejectCallBtn');

// Call status elements
const callStatus = document.getElementById('callStatus');
const callStatusMessage = document.getElementById('callStatusMessage');
const callLoader = document.getElementById('callLoader');

// Global state
let state = {
    userId: null,
    username: null,
    localStream: null,
    peerConnection: null,
    socket: null,
    targetUser: null,
    currentCallId: null,
    isInitiator: false,
    videoEnabled: true,
    audioEnabled: true,
    iceCandidateQueue: []
};

// Browser compatibility and capabilities
const browserSupport = {
    webRTC: false,
    getUserMedia: false,
    websocket: false,
    clipboard: false,
    name: 'unknown',
    isMobile: false
};

// WebRTC configuration
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
};

// WebSocket URL - adjust for production
const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const wsUrl = wsProtocol + window.location.host;

// Initialize the application
window.addEventListener('load', () => {
    detectBrowserCapabilities();
    if (browserSupport.webRTC) {
        initMediaDevices();
    }
    
    // Add event listeners
    setupEventListeners();
});

// Detect browser capabilities
function detectBrowserCapabilities() {
    // Detect browser name
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Chrome") > -1) {
        browserSupport.name = 'Chrome';
    } else if (userAgent.indexOf("Safari") > -1) {
        browserSupport.name = 'Safari';
    } else if (userAgent.indexOf("Firefox") > -1) {
        browserSupport.name = 'Firefox';
    } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
        browserSupport.name = 'IE';
    } else if (userAgent.indexOf("Edge") > -1) {
        browserSupport.name = 'Edge';
    }
    
    // Check if mobile device
    browserSupport.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check WebRTC support
    browserSupport.webRTC = (
        window.RTCPeerConnection !== undefined && 
        window.RTCIceCandidate !== undefined && 
        window.RTCSessionDescription !== undefined
    );
    
    // Check getUserMedia support
    browserSupport.getUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    // Check WebSocket support
    browserSupport.websocket = ('WebSocket' in window);
    
    // Check clipboard API support
    browserSupport.clipboard = !!(navigator.clipboard && navigator.clipboard.writeText);
    
    console.log('Browser capabilities detected:', browserSupport);
    
    // Show warning for limitations
    if (!browserSupport.webRTC) {
        showError('Your browser does not support WebRTC. Please use Chrome, Firefox, Safari, or Edge.');
        disableApp();
    } else if (!browserSupport.getUserMedia) {
        compatWarning.classList.remove('hidden');
        showMessage('Your browser has limited WebRTC support. You can continue in receive-only mode.');
    } else if (!browserSupport.websocket) {
        showError('Your browser does not support WebSockets. Please use a modern browser.');
        disableApp();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Login events
    loginBtn.addEventListener('click', handleLogin);
    username.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Search events
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Call events
    callBtn.addEventListener('click', startCall);
    acceptCallBtn.addEventListener('click', acceptCall);
    rejectCallBtn.addEventListener('click', rejectCall);
    hangupBtn.addEventListener('click', endCall);
    
    // Media toggles
    toggleVideoBtn.addEventListener('click', toggleVideo);
    toggleAudioBtn.addEventListener('click', toggleAudio);
    
    // Compatibility warning
    if (dismissWarning) {
        dismissWarning.addEventListener('click', () => {
            compatWarning.classList.add('hidden');
        });
    }
}

// Initialize media devices
async function initMediaDevices() {
    try {
        // Check for WebRTC support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('WebRTC getUserMedia is not fully supported in this browser. You can still use the app but without camera/microphone access.');
        }
        
        // Try to get media permissions
        showMessage('Requesting camera and microphone access...');
        state.localStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true 
        });
        
        localVideo.srcObject = state.localStream;
        updateMediaStatus();
    } catch (error) {
        console.error('Error accessing media devices:', error);
        let errorMessage = 'Camera/microphone access issue: ';
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage += 'You need to grant camera and microphone permissions.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage += 'No camera or microphone found.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage += 'Your camera or microphone is already in use by another application.';
        } else if (error.name === 'OverconstrainedError') {
            errorMessage += 'The requested camera/microphone constraints cannot be satisfied.';
        } else {
            errorMessage += error.message || 'Unknown error.';
        }
        
        showMessage(errorMessage);
        updateMediaStatus();
    }
}

// Update media status indicators
function updateMediaStatus() {
    // Check camera status
    if (!state.localStream) {
        cameraStatus.textContent = "📷 Camera: Not available";
        cameraStatus.style.backgroundColor = "#ffcccc";
        micStatus.textContent = "🎤 Mic: Not available";
        micStatus.style.backgroundColor = "#ffcccc";
        return;
    }

    const videoTracks = state.localStream.getVideoTracks();
    if (videoTracks.length === 0) {
        cameraStatus.textContent = "📷 Camera: Not found";
        cameraStatus.style.backgroundColor = "#ffcccc";
    } else {
        const videoTrack = videoTracks[0];
        cameraStatus.textContent = `📷 Camera: ${videoTrack.enabled ? 'On' : 'Off'}`;
        cameraStatus.style.backgroundColor = videoTrack.enabled ? "#d4edda" : "#fff3cd";
    }

    const audioTracks = state.localStream.getAudioTracks();
    if (audioTracks.length === 0) {
        micStatus.textContent = "🎤 Mic: Not found";
        micStatus.style.backgroundColor = "#ffcccc";
    } else {
        const audioTrack = audioTracks[0];
        micStatus.textContent = `🎤 Mic: ${audioTrack.enabled ? 'On' : 'Off'}`;
        micStatus.style.backgroundColor = audioTrack.enabled ? "#d4edda" : "#fff3cd";
    }
}

// Request camera permission manually
async function requestCameraPermission() {
    try {
        showMessage('Requesting camera and microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 320 }, height: { ideal: 240 } },
            audio: true 
        });
        
        // If we got here, permission was granted
        state.localStream = stream;
        localVideo.srcObject = stream;
        showMessage('Camera permission granted! You can now send video.');
        updateMediaStatus();
        
        // If we're in a call already, add tracks to the existing connection
        if (state.peerConnection && state.peerConnection.connectionState === 'connected') {
            stream.getTracks().forEach(track => {
                state.peerConnection.addTrack(track, stream);
            });
            showMessage('Added your video/audio to the existing call!');
        }
        
        // Hide the warning
        compatWarning.classList.add('hidden');
        
    } catch (error) {
        console.error('Permission request failed:', error);
        showError('Camera permission denied or not available: ' + error.message);
        updateMediaStatus();
    }
}

// Connect to WebSocket server
function connectWebSocket() {
    state.socket = new WebSocket(wsUrl);
    
    state.socket.onopen = () => {
        console.log('WebSocket connected!');
        showMessage('Connected to signaling server');
    };
    
    state.socket.onclose = () => {
        console.log('WebSocket disconnected');
        showMessage('Disconnected from signaling server. Refresh to reconnect.');
    };
    
    state.socket.onerror = error => {
        console.error('WebSocket error:', error);
        showError('Error connecting to signaling server');
    };
    
    state.socket.onmessage = event => {
        try {
            const data = JSON.parse(event.data);
            handleSignalingMessage(data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    };
}

// Handle signaling messages
function handleSignalingMessage(data) {
    console.log('Received message:', data.type);
    
    switch(data.type) {
        case 'registered':
            handleRegistered(data);
            break;
            
        case 'error':
            showError(data.message);
            break;
            
        case 'search_result':
            handleSearchResult(data);
            break;
            
        case 'incoming_call':
            handleIncomingCall(data);
            break;
            
        case 'call_requested':
            showCallStatus(`Calling ${state.targetUser.name}...`, true);
            break;
            
        case 'call_accepted':
            handleCallAccepted(data);
            break;
            
        case 'call_rejected':
            handleCallRejected(data);
            break;
            
        case 'call_connecting':
            showCallStatus('Call connecting...', true);
            break;
            
        case 'webrtc_offer':
            handleWebRTCOffer(data);
            break;
            
        case 'webrtc_answer':
            handleWebRTCAnswer(data);
            break;
            
        case 'webrtc_ice_candidate':
            handleIceCandidate(data);
            break;
            
        case 'call_ended':
            handleCallEnded(data);
            break;
            
        case 'call_expired':
            showMessage('Call request expired');
            hideCallStatus();
            break;
            
        default:
            console.log('Unknown message type:', data.type);
    }
}

// Registration successful
function handleRegistered(data) {
    state.userId = data.id;
    showMessage(data.message);
    
    // Show dashboard
    loginScreen.classList.add('hidden');
    callDashboard.classList.remove('hidden');
    userDisplayName.textContent = state.username;
}

// Handle search results
function handleSearchResult(data) {
    if (data.found) {
        searchResult.textContent = `Found user: ${data.name}`;
        searchResult.style.color = '#28a745';
        callBtn.classList.remove('hidden');
        // Store target user
        state.targetUser = {
            id: data.id,
            name: data.name
        };
    } else {
        searchResult.textContent = `User not found: ${data.name}`;
        searchResult.style.color = '#dc3545';
        callBtn.classList.add('hidden');
        state.targetUser = null;
    }
    searchResult.classList.remove('hidden');
}

// Handle incoming call
function handleIncomingCall(data) {
    state.currentCallId = data.callId;
    callerName.textContent = data.from;
    callNotification.classList.remove('hidden');
    // Play sound
    playSound('ringtone');
}

// Handle call accepted
function handleCallAccepted(data) {
    hideCallStatus();
    state.isInitiator = true;
    createPeerConnection();
    
    // Create and send offer
    sendWebRTCOffer(data.targetId);
}

// Handle call rejected
function handleCallRejected() {
    hideCallStatus();
    state.currentCallId = null;
    state.targetUser = null;
    showMessage('Call was rejected');
}

// Handle WebRTC offer
async function handleWebRTCOffer(data) {
    // Create peer connection if not exists
    if (!state.peerConnection) {
        createPeerConnection();
    }
    
    try {
        // Set remote description
        await state.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Process any queued ICE candidates
        while (state.iceCandidateQueue.length) {
            const candidate = state.iceCandidateQueue.shift();
            await state.peerConnection.addIceCandidate(candidate);
        }
        
        // Create answer
        const answer = await state.peerConnection.createAnswer();
        await state.peerConnection.setLocalDescription(answer);
        
        // Send answer
        sendToServer({
            type: 'webrtc_answer',
            callerId: data.callerId,
            answer: state.peerConnection.localDescription
        });
        
    } catch (error) {
        console.error('Error handling WebRTC offer:', error);
        showError('Failed to process call connection: ' + error.message);
    }
}

// Handle WebRTC answer
async function handleWebRTCAnswer(data) {
    try {
        await state.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('Remote description set successfully');
        
        // Process any queued ICE candidates
        while (state.iceCandidateQueue.length) {
            const candidate = state.iceCandidateQueue.shift();
            await state.peerConnection.addIceCandidate(candidate);
        }
    } catch (error) {
        console.error('Error setting remote description:', error);
        showError('Failed to complete call connection: ' + error.message);
    }
}

// Handle ICE candidate
function handleIceCandidate(data) {
    const candidate = new RTCIceCandidate(data.candidate);
    
    if (state.peerConnection && state.peerConnection.remoteDescription) {
        state.peerConnection.addIceCandidate(candidate)
            .catch(error => console.error('Error adding ICE candidate:', error));
    } else {
        // Queue candidates until we have a remote description
        state.iceCandidateQueue.push(candidate);
    }
}

// Handle call ended
function handleCallEnded() {
    endCallCleanup();
    showMessage('Call ended by the other person');
}

// Handle login attempt
function handleLogin() {
    const name = username.value.trim();
    if (!name) {
        loginMessage.textContent = 'Please enter a name';
        return;
    }
    
    state.username = name;
    connectWebSocket();
    
    setTimeout(() => {
        // Register with server
        sendToServer({
            type: 'register',
            name: name
        });
    }, 1000);
}

// Handle search
function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        showError('Please enter a name to search');
        return;
    }
    
    sendToServer({
        type: 'search',
        name: query
    });
}

// Start a call
function startCall() {
    if (!state.targetUser) {
        showError('No user selected to call');
        return;
    }
    
    sendToServer({
        type: 'call_request',
        targetId: state.targetUser.id
    });
}

// Accept incoming call
function acceptCall() {
    callNotification.classList.add('hidden');
    
    // Stop ringtone
    stopSound('ringtone');
    
    sendToServer({
        type: 'call_response',
        callId: state.currentCallId,
        accept: true
    });
    
    showCallStatus('Connecting to call...', true);
}

// Reject incoming call
function rejectCall() {
    callNotification.classList.add('hidden');
    
    // Stop ringtone
    stopSound('ringtone');
    
    sendToServer({
        type: 'call_response',
        callId: state.currentCallId,
        accept: false
    });
    
    state.currentCallId = null;
}

// End the call
function endCall() {
    if (state.peerConnection) {
        // Notify other user
        if (state.targetUser) {
            sendToServer({
                type: 'end_call',
                targetId: state.targetUser.id
            });
        }
        
        endCallCleanup();
    }
}

// Clean up after call ends
function endCallCleanup() {
    // Close peer connection
    if (state.peerConnection) {
        state.peerConnection.close();
        state.peerConnection = null;
    }
    
    // Reset state
    state.currentCallId = null;
    state.targetUser = null;
    state.isInitiator = false;
    state.iceCandidateQueue = [];
    
    // Hide call UI
    videoContainer.classList.add('hidden');
    callControls.classList.add('hidden');
    hideCallStatus();
    
    // Clear remote video
    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }
}

// Create WebRTC peer connection
function createPeerConnection() {
    state.peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Add local stream tracks to the connection
    if (state.localStream) {
        state.localStream.getTracks().forEach(track => {
            state.peerConnection.addTrack(track, state.localStream);
        });
    } else {
        console.warn('No local media stream available. Creating connection without audio/video.');
        showMessage('Warning: No camera/mic access. Call will have no audio/video from your side.');
    }
    
    // Handle incoming stream
    state.peerConnection.ontrack = event => {
        if (event.streams && event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
            videoContainer.classList.remove('hidden');
            callControls.classList.remove('hidden');
            hideCallStatus();
            showMessage('Connected! Call in progress.');
        }
    };
    
    // Handle ICE candidates
    state.peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log("ICE candidate:", event.candidate);
            
            // Send the ICE candidate to the other peer
            const targetId = state.isInitiator ? state.targetUser.id : state.peerConnection.currentRemoteDescription?.from;
            
            if (targetId) {
                sendToServer({
                    type: 'webrtc_ice_candidate',
                    targetId: targetId,
                    candidate: event.candidate
                });
            }
        } else {
            console.log("All ICE candidates gathered");
        }
    };
    
    // Handle connection state changes
    state.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', state.peerConnection.iceConnectionState);
        
        if (state.peerConnection.iceConnectionState === 'connected' || 
            state.peerConnection.iceConnectionState === 'completed') {
            showMessage('Call connected!');
        } else if (state.peerConnection.iceConnectionState === 'disconnected') {
            showMessage('Call connection interrupted. Trying to reconnect...');
        } else if (state.peerConnection.iceConnectionState === 'failed') {
            showError('Call connection failed');
            setTimeout(endCall, 2000);
        } else if (state.peerConnection.iceConnectionState === 'closed') {
            showMessage('Call ended');
        }
    };
    
    return state.peerConnection;
}

// Send WebRTC offer
async function sendWebRTCOffer(targetId) {
    try {
        const offer = await state.peerConnection.createOffer();
        await state.peerConnection.setLocalDescription(offer);
        
        // Wait for ICE gathering to complete
        await new Promise(resolve => {
            if (state.peerConnection.iceGatheringState === 'complete') {
                resolve();
            } else {
                state.peerConnection.addEventListener('icegatheringstatechange', () => {
                    if (state.peerConnection.iceGatheringState === 'complete') {
                        resolve();
                    }
                });
                
                // Fallback in case gathering takes too long
                setTimeout(resolve, 5000);
            }
        });
        
        // Send the offer to the target
        sendToServer({
            type: 'webrtc_offer',
            targetId: targetId,
            offer: state.peerConnection.localDescription
        });
        
    } catch (error) {
        console.error('Error creating offer:', error);
        showError('Failed to create call connection: ' + error.message);
    }
}

// Toggle video
function toggleVideo() {
    if (!state.localStream) {
        showMessage('No local video stream available.');
        return;
    }
    
    const videoTracks = state.localStream.getVideoTracks();
    if (videoTracks.length === 0) {
        showMessage('No video track available.');
        return;
    }
    
    state.videoEnabled = !state.videoEnabled;
    videoTracks.forEach(track => {
        track.enabled = state.videoEnabled;
    });
    toggleVideoBtn.textContent = state.videoEnabled ? 'Toggle Video' : 'Enable Video';
    updateMediaStatus();
}

// Toggle audio
function toggleAudio() {
    if (!state.localStream) {
        showMessage('No local audio stream available.');
        return;
    }
    
    const audioTracks = state.localStream.getAudioTracks();
    if (audioTracks.length === 0) {
        showMessage('No audio track available.');
        return;
    }
    
    state.audioEnabled = !state.audioEnabled;
    audioTracks.forEach(track => {
        track.enabled = state.audioEnabled;
    });
    toggleAudioBtn.textContent = state.audioEnabled ? 'Toggle Audio' : 'Enable Audio';
    updateMediaStatus();
}

// Show call status
function showCallStatus(message, showLoader = false) {
    callStatus.classList.remove('hidden');
    callStatusMessage.textContent = message;
    
    if (showLoader) {
        callLoader.classList.remove('hidden');
    } else {
        callLoader.classList.add('hidden');
    }
}

// Hide call status
function hideCallStatus() {
    callStatus.classList.add('hidden');
}

// Show error message
function showError(message) {
    statusMessage.textContent = message;
    statusMessage.style.color = '#e74c3c';
}

// Show regular message
function showMessage(message) {
    statusMessage.textContent = message;
    statusMessage.style.color = '#333';
}

// Disable app functionality
function disableApp() {
    loginBtn.disabled = true;
    searchBtn.disabled = true;
    callBtn.disabled = true;
    acceptCallBtn.disabled = true;
    rejectCallBtn.disabled = true;
    hangupBtn.disabled = true;
    toggleVideoBtn.disabled = true;
    toggleAudioBtn.disabled = true;
}

// Send message to WebSocket server
function sendToServer(message) {
    if (state.socket && state.socket.readyState === WebSocket.OPEN) {
        state.socket.send(JSON.stringify(message));
    } else {
        showError('Not connected to server');
    }
}

// Sound functions
const sounds = {};

function playSound(name) {
    if (sounds[name]) {
        sounds[name].play();
        return;
    }
    
    // Create ringtone sound
    if (name === 'ringtone') {
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQBAADpSW1vSS5nsUkB/0kF/0kJlkvS/01l/1Kk/0v//0wPY00BIE0JDU4kpVAmb1Eo/1IqZ1QsHVQt4VQuaFMvE1Iv0Fkw0mcx1nQyd4EzL4Yz04cz34gy6IUx6IEw54Ev3X8u2X4t2H4s2X8s3IEs4YQs5IYs5ocs6Ios64ws7I4s7Y8t7pAt7pAt7o8t7Y4t7I0t6oss6Ios54cs5oYs5YUs44Ms4IAs3X4s2nss13cs1nUs03Is0G8szm0symstyWotyGkux2kux2kuwGYpuWMosV8npFomklUli08kfUkjcUMibj4haDogYjQfWy8eUiseRCYdPSIdNx8dMRwdLRkdKRYdtA4CnwQBkAEA';
        audio.loop = true;
        sounds[name] = audio;
        audio.play();
    }
}

function stopSound(name) {
    if (sounds[name]) {
        sounds[name].pause();
        sounds[name].currentTime = 0;
    }
} 