// DOM elements - StarLight UI
const loadingScreen = document.getElementById('loadingScreen');
const authScreen = document.getElementById('authScreen');
const mainScreen = document.getElementById('mainScreen');
const callScreen = document.getElementById('callScreen');
const contactModal = document.getElementById('contactModal');
const incomingCallAlert = document.getElementById('incomingCallAlert');

// Auth elements
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authMessage = document.getElementById('authMessage');

// Main app elements
const userFullName = document.getElementById('userFullName');
const userNumber = document.getElementById('userNumber');
const userInitials = document.getElementById('userInitials');
const contactsTab = document.getElementById('contactsTab');
const recentsTab = document.getElementById('recentsTab');
const keypadTab = document.getElementById('keypadTab');
const contactsPane = document.getElementById('contactsPane');
const recentsPane = document.getElementById('recentsPane');
const keypadPane = document.getElementById('keypadPane');
const contactsList = document.getElementById('contactsList');
const recentsList = document.getElementById('recentsList');
const searchInput = document.getElementById('contactSearch');
const keypadInput = document.getElementById('keypadInput');
const addContactForm = document.getElementById('addContactForm');
const logoutBtn = document.getElementById('logoutBtn');

// Call screen elements
const callerName = document.getElementById('callerName');
const callerNumber = document.getElementById('callerNumber');
const callerInitials = document.getElementById('callerInitials');
const callStatusText = document.getElementById('callStatusText');
const callDuration = document.getElementById('callDuration');
const callVideoContainer = document.getElementById('callVideoContainer');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const toggleMuteBtn = document.getElementById('toggleMuteBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const toggleSpeakerBtn = document.getElementById('toggleSpeakerBtn');
const endCallBtn = document.getElementById('endCallBtn');
const incomingCallActions = document.getElementById('incomingCallActions');
const ongoingCallActions = document.getElementById('ongoingCallActions');

// Incoming call elements
const incomingCallerName = document.getElementById('incomingCallerName');
const incomingCallerNumber = document.getElementById('incomingCallerNumber');
const incomingCallerInitials = document.getElementById('incomingCallerInitials');
const acceptCallBtn = document.getElementById('alertAcceptBtn');
const rejectCallBtn = document.getElementById('alertRejectBtn');

// WebRTC configuration
const webrtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

// Global state
const state = {
    user: null,
    contacts: [],
    callHistory: [],
    currentCall: null,
    localStream: null,
    remoteStream: null,
    isCallInProgress: false,
    callStartTime: null,
    currentTab: 'contacts',
    videoEnabled: true,
    audioEnabled: true,
    peerConnection: null,
    websocket: null,
    onlineUsers: new Set(),
    isSocketConnected: false
};

// Initialize the app
function initApp() {
    console.log('Initializing StarLight app...');
    
    // Simulate loading time
    setTimeout(() => {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            state.user = JSON.parse(savedUser);
            loadUserData();
            connectToSignalingServer();
            showScreen(mainScreen);
        } else {
            showScreen(authScreen);
        }
    }, 1000);

    // Initialize event listeners
    initEventListeners();
}

// Load user data from local storage
function loadUserData() {
    // Load contacts
    const savedContacts = localStorage.getItem('contacts');
    if (savedContacts) {
        state.contacts = JSON.parse(savedContacts);
        renderContacts();
    }

    // Load call history
    const savedHistory = localStorage.getItem('callHistory');
    if (savedHistory) {
        state.callHistory = JSON.parse(savedHistory);
        renderRecents();
    }

    // Update UI with user info
    if (userFullName) userFullName.textContent = state.user.fullName;
    if (userNumber) userNumber.textContent = state.user.number;
    if (userInitials) userInitials.textContent = getInitials(state.user.fullName);
}

// Show specific screen
function showScreen(screen) {
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (authScreen) authScreen.classList.add('hidden');
    if (mainScreen) mainScreen.classList.add('hidden');
    if (callScreen) callScreen.classList.add('hidden');
    
    if (screen) screen.classList.remove('hidden');
}

// Initialize event listeners
function initEventListeners() {
    console.log('Setting up event listeners...');
    
    // Auth screen listeners
    if (loginTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        });
    }

    if (signupTab) {
        signupTab.addEventListener('click', () => {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin(e);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSignup(e);
        });
    }

    // Main screen tab listeners
    if (contactsTab) {
        contactsTab.addEventListener('click', () => {
            setActiveTab('contacts');
        });
    }

    if (recentsTab) {
        recentsTab.addEventListener('click', () => {
            setActiveTab('recents');
        });
    }

    if (keypadTab) {
        keypadTab.addEventListener('click', () => {
            setActiveTab('keypad');
        });
    }

    // Search contacts
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            renderContacts(query);
        });
    }

    // Add contact
    const addContactBtn = document.getElementById('addContactBtn');
    if (addContactBtn) {
        addContactBtn.addEventListener('click', () => {
            if (contactModal) contactModal.classList.add('active');
        });
    }

    const closeContactModal = document.getElementById('closeContactModal');
    if (closeContactModal) {
        closeContactModal.addEventListener('click', () => {
            if (contactModal) contactModal.classList.remove('active');
        });
    }

    if (addContactForm) {
        addContactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = e.target.elements.contactName.value;
            const number = e.target.elements.contactNumber.value;

            addContact(name, number);
            contactModal.classList.remove('active');
            addContactForm.reset();
        });
    }

    // Add event listeners for keypad buttons
    const keypadBtns = document.querySelectorAll('.keypad-btn');
    keypadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-key');
            const keypadInput = document.getElementById('keypadInput');
            if (keypadInput) {
                keypadInput.value += key;
            }
        });
    });

    // Add event listener for keypad clear button
    const keypadClearBtn = document.getElementById('keypadClearBtn');
    if (keypadClearBtn) {
        keypadClearBtn.addEventListener('click', () => {
            const keypadInput = document.getElementById('keypadInput');
            if (keypadInput && keypadInput.value.length > 0) {
                keypadInput.value = keypadInput.value.slice(0, -1);
            }
        });
    }

    // Add event listener for keypad call button
    const keypadCallBtn = document.getElementById('keypadCallBtn');
    if (keypadCallBtn) {
        keypadCallBtn.addEventListener('click', () => {
            const keypadInput = document.getElementById('keypadInput');
            if (keypadInput && keypadInput.value.trim()) {
                const number = keypadInput.value.trim();
                initiateCall(number);
                keypadInput.value = '';
            }
        });
    }

    // Call screen action listeners
    if (toggleMuteBtn) {
        toggleMuteBtn.addEventListener('click', toggleMute);
    }

    if (toggleVideoBtn) {
        toggleVideoBtn.addEventListener('click', toggleVideo);
    }

    if (toggleSpeakerBtn) {
        toggleSpeakerBtn.addEventListener('click', toggleSpeaker);
    }

    if (endCallBtn) {
        endCallBtn.addEventListener('click', endCall);
    }

    // Incoming call action listeners
    if (acceptCallBtn) {
        acceptCallBtn.addEventListener('click', acceptIncomingCall);
    }

    if (rejectCallBtn) {
        rejectCallBtn.addEventListener('click', rejectIncomingCall);
    }

    // User logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Handle login form submission
function handleLogin(e) {
    const email = e.target.elements.loginEmail.value;
    const password = e.target.elements.loginPassword.value;
    
    // Simple login validation
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const user = savedUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        state.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        loadUserData();
        connectToSignalingServer();
        showScreen(mainScreen);
    } else {
        if (authMessage) authMessage.textContent = 'Invalid email or password';
    }
}

// Handle signup form submission
function handleSignup(e) {
    const fullName = e.target.elements.signupName.value;
    const email = e.target.elements.signupEmail.value;
    const password = e.target.elements.signupPassword.value;
    
    // Generate a random number (in a real app, this would be handled by a backend)
    const number = generateUniqueNumber();
    
    // Save user
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if email already exists
    if (savedUsers.some(u => u.email === email)) {
        if (authMessage) authMessage.textContent = 'Email already registered';
        return;
    }
    
    const newUser = { fullName, email, password, number };
    savedUsers.push(newUser);
    
    localStorage.setItem('users', JSON.stringify(savedUsers));
    
    // Log in the new user
    state.user = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
    loadUserData();
    showScreen(mainScreen);
}

// Set active tab
function setActiveTab(tabName) {
    state.currentTab = tabName;
    
    // Update tab buttons
    if (contactsTab) contactsTab.classList.remove('active');
    if (recentsTab) recentsTab.classList.remove('active');
    if (keypadTab) keypadTab.classList.remove('active');
    
    // Update tab panes
    if (contactsPane) contactsPane.classList.remove('active');
    if (recentsPane) recentsPane.classList.remove('active');
    if (keypadPane) keypadPane.classList.remove('active');
    
    // Set active tab and pane
    if (tabName === 'contacts') {
        if (contactsTab) contactsTab.classList.add('active');
        if (contactsPane) contactsPane.classList.add('active');
    } else if (tabName === 'recents') {
        if (recentsTab) recentsTab.classList.add('active');
        if (recentsPane) recentsPane.classList.add('active');
    } else if (tabName === 'keypad') {
        if (keypadTab) keypadTab.classList.add('active');
        if (keypadPane) keypadPane.classList.add('active');
    }
}

// Render contacts
function renderContacts(searchQuery = '') {
    if (!contactsList) return;
    
    contactsList.innerHTML = '';
    
    const filteredContacts = searchQuery 
        ? state.contacts.filter(c => 
            c.name.toLowerCase().includes(searchQuery) || 
            c.number.includes(searchQuery))
        : state.contacts;
    
    if (filteredContacts.length === 0) {
        contactsList.innerHTML = `
            <div class="empty-message">
                ${searchQuery ? 'No contacts matching your search' : 'No contacts yet'}
            </div>
        `;
        return;
    }
    
    filteredContacts.sort((a, b) => a.name.localeCompare(b.name))
        .forEach(contact => {
            const contactEl = document.createElement('div');
            contactEl.className = 'contact-item';
            contactEl.innerHTML = `
                <div class="contact-avatar">${getInitials(contact.name)}</div>
                <div class="contact-info">
                    <h3>${contact.name}</h3>
                    <p>${formatPhoneNumber(contact.number)}</p>
                </div>
                <div class="contact-actions">
                    <button class="call-contact-btn" data-number="${contact.number}">
                        <i class="fas fa-phone-alt"></i>
                    </button>
                    <button class="video-contact-btn" data-number="${contact.number}">
                        <i class="fas fa-video"></i>
                    </button>
                </div>
            `;
            
            contactsList.appendChild(contactEl);
            
            // Add event listeners to the call buttons
            contactEl.querySelector('.call-contact-btn').addEventListener('click', () => {
                initiateCall(contact.number, false);
            });
            
            contactEl.querySelector('.video-contact-btn').addEventListener('click', () => {
                initiateCall(contact.number, true);
            });
        });
}

// Render recent calls
function renderRecents() {
    if (!recentsList) return;
    
    recentsList.innerHTML = '';
    
    if (state.callHistory.length === 0) {
        recentsList.innerHTML = `
            <div class="empty-message">No recent calls</div>
        `;
        return;
    }
    
    // Show most recent calls first
    [...state.callHistory].reverse().forEach(call => {
        const contactName = getContactNameByNumber(call.number) || 'Unknown';
        const typeClass = call.type === 'missed' ? 'missed-call' : 
                        call.direction === 'outgoing' ? 'outgoing-call' : 'incoming-call';
        const typeIcon = call.type === 'missed' ? 'phone-missed' : 
                       call.direction === 'outgoing' ? 'phone-alt' : 'phone';
        
        const recentEl = document.createElement('div');
        recentEl.className = 'recent-item';
        recentEl.innerHTML = `
            <div class="recent-type ${typeClass}">
                <i class="fas fa-${typeIcon}"></i>
            </div>
            <div class="contact-avatar">${getInitials(contactName)}</div>
            <div class="recent-info">
                <h3>${contactName}</h3>
                <div class="recent-meta">
                    <span>${formatPhoneNumber(call.number)}</span>
                    <span class="recent-time">${formatCallTime(call.timestamp)}</span>
                </div>
            </div>
            <button class="call-recent-btn" data-number="${call.number}">
                <i class="fas fa-phone-alt"></i>
            </button>
        `;
        
        recentsList.appendChild(recentEl);
        
        // Add event listener to call button
        recentEl.querySelector('.call-recent-btn').addEventListener('click', () => {
            initiateCall(call.number);
        });
    });
}

// Add a new contact
function addContact(name, number) {
    const newContact = { name, number };
    
    // Check if contact already exists
    const existingIndex = state.contacts.findIndex(c => c.number === number);
    if (existingIndex !== -1) {
        state.contacts[existingIndex] = newContact;
    } else {
        state.contacts.push(newContact);
    }
    
    // Save to local storage
    localStorage.setItem('contacts', JSON.stringify(state.contacts));
    
    // Update UI
    renderContacts();
}

// Initiate a call
function initiateCall(number, withVideo = false) {
    // Find contact name if available
    const contactName = getContactNameByNumber(number) || 'Unknown';
    
    // Set current call information
    state.currentCall = {
        number: number,
        name: contactName,
        direction: 'outgoing',
        withVideo: withVideo
    };
    
    // Set call screen information
    if (callerName) callerName.textContent = contactName;
    if (callerNumber) callerNumber.textContent = formatPhoneNumber(number);
    if (callerInitials) callerInitials.textContent = getInitials(contactName);
    
    // Show/hide appropriate call actions
    if (incomingCallActions) incomingCallActions.classList.add('hidden');
    if (ongoingCallActions) ongoingCallActions.classList.remove('hidden');
    
    // Initialize WebRTC
    setupWebRTC(withVideo);
    
    // Show call screen
    showScreen(callScreen);
    
    // Update call status
    updateCallStatus('Calling...');
    
    // Send call request to signaling server
    sendToSignalingServer({
        type: 'call-request',
        from: state.user.number,
        to: number
    });
    
    // Add to call history
    addCallHistory({
        number,
        direction: 'outgoing',
        type: 'initiated',
        timestamp: Date.now(),
        duration: 0 // Will be updated when call ends
    });
}

// Accept incoming call
function acceptIncomingCall() {
    if (!state.currentCall) return;
    
    const { number, name } = state.currentCall;
    
    // Hide incoming call alert
    if (incomingCallAlert) incomingCallAlert.classList.add('hidden');
    
    // Set call screen information
    if (callerName) callerName.textContent = name;
    if (callerNumber) callerNumber.textContent = formatPhoneNumber(number);
    if (callerInitials) callerInitials.textContent = getInitials(name);
    
    // Show/hide appropriate call actions
    if (incomingCallActions) incomingCallActions.classList.add('hidden');
    if (ongoingCallActions) ongoingCallActions.classList.remove('hidden');
    
    // Initialize WebRTC
    setupWebRTC(false);
    
    // Create peer connection
    createPeerConnection(number);
    
    // Send call response to signaling server
    sendToSignalingServer({
        type: 'call-response',
        from: state.user.number,
        to: number,
        accepted: true
    });
    
    // Add to call history
    addCallHistory({
        number,
        direction: 'incoming',
        type: 'completed',
        timestamp: Date.now(),
        duration: 0 // Will be updated when call ends
    });
    
    // Show call screen
    showScreen(callScreen);
    
    // Update call status
    updateCallStatus('Connecting...');
    
    // Start call timer
    state.callStartTime = Date.now();
    startCallTimer();
}

// Reject incoming call
function rejectIncomingCall() {
    if (!state.currentCall) return;
    
    const { number } = state.currentCall;
    
    // Hide incoming call alert
    if (incomingCallAlert) incomingCallAlert.classList.add('hidden');
    
    // Send call response to signaling server
    sendToSignalingServer({
        type: 'call-response',
        from: state.user.number,
        to: number,
        accepted: false
    });
    
    // Add to call history as missed
    addCallHistory({
        number,
        direction: 'incoming',
        type: 'rejected',
        timestamp: Date.now(),
        duration: 0
    });
    
    // Reset current call
    state.currentCall = null;
    
    // Update recents tab
    renderRecents();
}

// End current call
function endCall() {
    // Notify the remote peer if there's an active call
    if (state.currentCall) {
        sendToSignalingServer({
            type: 'end-call',
            to: state.currentCall.number
        });
    }
    
    // Clean up WebRTC
    cleanupWebRTC();
    
    // Update call history with duration
    if (state.callStartTime) {
        const callDurationSecs = Math.round((Date.now() - state.callStartTime) / 1000);
        
        // Update the last call in history
        if (state.callHistory.length > 0) {
            const lastCall = state.callHistory[state.callHistory.length - 1];
            lastCall.duration = callDurationSecs;
            lastCall.type = 'completed';
            localStorage.setItem('callHistory', JSON.stringify(state.callHistory));
        }
        
        state.callStartTime = null;
    }
    
    // Reset call status
    updateCallStatus('');
    
    // Reset current call
    state.currentCall = null;
    
    // Return to main screen
    showScreen(mainScreen);
    
    // Update recents tab
    renderRecents();
}

// Toggle audio mute
function toggleMute() {
    if (state.localStream) {
        const audioTracks = state.localStream.getAudioTracks();
        if (audioTracks.length > 0 && toggleMuteBtn) {
            const muted = !audioTracks[0].enabled;
            audioTracks[0].enabled = muted;
            toggleMuteBtn.querySelector('i').className = muted ? 'fas fa-microphone' : 'fas fa-microphone-slash';
            toggleMuteBtn.querySelector('span').textContent = muted ? 'Mute' : 'Unmute';
        }
    }
}

// Toggle video
function toggleVideo() {
    if (state.localStream) {
        const videoTracks = state.localStream.getVideoTracks();
        if (videoTracks.length > 0 && toggleVideoBtn && callVideoContainer) {
            const videoEnabled = !videoTracks[0].enabled;
            videoTracks[0].enabled = videoEnabled;
            toggleVideoBtn.querySelector('i').className = videoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
            toggleVideoBtn.querySelector('span').textContent = videoEnabled ? 'Stop Video' : 'Start Video';
            
            // Show/hide video container
            callVideoContainer.classList.toggle('hidden', !videoEnabled);
        }
    }
}

// Toggle speaker
function toggleSpeaker() {
    // In a real implementation, this would use the AudioContext API
    // For demo purposes, we'll just toggle the button state
    if (toggleSpeakerBtn) {
        const speakerActive = toggleSpeakerBtn.classList.toggle('active');
        toggleSpeakerBtn.querySelector('i').className = speakerActive ? 'fas fa-volume-up' : 'fas fa-volume-down';
        toggleSpeakerBtn.querySelector('span').textContent = speakerActive ? 'Speaker' : 'Earpiece';
    }
}

// Update call status text
function updateCallStatus(status) {
    if (callStatusText) callStatusText.textContent = status;
}

// Start call timer
function startCallTimer() {
    if (!callDuration) return;
    
    let seconds = 0;
    const timerInterval = setInterval(() => {
        if (!state.callStartTime) {
            clearInterval(timerInterval);
            callDuration.textContent = '';
            return;
        }
        
        seconds = Math.floor((Date.now() - state.callStartTime) / 1000);
        callDuration.textContent = formatCallDuration(seconds);
    }, 1000);
}

// Add to call history
function addCallHistory(call) {
    state.callHistory.push(call);
    
    // Keep only the last 50 calls
    if (state.callHistory.length > 50) {
        state.callHistory = state.callHistory.slice(-50);
    }
    
    localStorage.setItem('callHistory', JSON.stringify(state.callHistory));
    renderRecents();
}

// Logout
function logout() {
    // Clean up
    localStorage.removeItem('user');
    
    // Disconnect from signaling server
    if (state.websocket) {
        state.websocket.close();
    }
    
    // Reset state
    state.user = null;
    state.isSocketConnected = false;
    state.onlineUsers.clear();
    cleanupWebRTC();
    
    // Go to auth screen
    showScreen(authScreen);
}

// WebRTC setup
async function setupWebRTC(withVideo = false) {
    try {
        // Get user media
        const constraints = {
            audio: true,
            video: withVideo
        };
        
        state.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Display local video if video is enabled
        if (withVideo && localVideo && callVideoContainer) {
            localVideo.srcObject = state.localStream;
            callVideoContainer.classList.remove('hidden');
        } else if (callVideoContainer) {
            callVideoContainer.classList.add('hidden');
        }
        
        // Initialize status of buttons
        const audioTrack = state.localStream.getAudioTracks()[0];
        if (audioTrack && toggleMuteBtn) {
            audioTrack.enabled = true;
            toggleMuteBtn.querySelector('i').className = 'fas fa-microphone';
            toggleMuteBtn.querySelector('span').textContent = 'Mute';
        }
        
        if (withVideo) {
            const videoTrack = state.localStream.getVideoTracks()[0];
            if (videoTrack && toggleVideoBtn) {
                videoTrack.enabled = true;
                toggleVideoBtn.querySelector('i').className = 'fas fa-video';
                toggleVideoBtn.querySelector('span').textContent = 'Stop Video';
            }
        }
        
        // If this is an outgoing call, create a peer connection
        if (state.currentCall && state.currentCall.direction === 'outgoing') {
            createPeerConnection(state.currentCall.number);
        }
    } catch (error) {
        console.error('Error accessing media devices', error);
        alert('Could not access camera/microphone. Please check permissions.');
        endCall();
    }
}

// Create peer connection
function createPeerConnection(remoteNumber) {
    // Clean up any existing connection
    cleanupPeerConnection();
    
    // Create a new peer connection
    state.peerConnection = new RTCPeerConnection(webrtcConfig);
    
    // Add local stream tracks to the peer connection
    if (state.localStream) {
        state.localStream.getTracks().forEach(track => {
            state.peerConnection.addTrack(track, state.localStream);
        });
    }
    
    // Set up ICE candidate handling
    state.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            // Send ICE candidate to signaling server
            sendToSignalingServer({
                type: 'ice-candidate',
                candidate: event.candidate,
                to: remoteNumber
            });
        }
    };
    
    // Handle ICE connection state changes
    state.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state change:', state.peerConnection.iceConnectionState);
        
        switch (state.peerConnection.iceConnectionState) {
            case 'connected':
            case 'completed':
                updateCallStatus('Connected');
                break;
            case 'disconnected':
                updateCallStatus('Connection lost, trying to reconnect...');
                break;
            case 'failed':
                updateCallStatus('Connection failed');
                setTimeout(endCall, 2000);
                break;
            case 'closed':
                updateCallStatus('Connection closed');
                break;
        }
    };
    
    // Handle track events (receiving remote media)
    state.peerConnection.ontrack = (event) => {
        console.log('Remote track received:', event.track.kind);
        
        if (event.streams && event.streams[0]) {
            state.remoteStream = event.streams[0];
            
            if (remoteVideo) {
                remoteVideo.srcObject = state.remoteStream;
                
                // Show video container if it's a video track
                if (event.track.kind === 'video' && callVideoContainer) {
                    callVideoContainer.classList.remove('hidden');
                }
            }
        }
    };
    
    return state.peerConnection;
}

// Create and send WebRTC offer
async function createAndSendOffer(remoteNumber) {
    if (!state.peerConnection) {
        createPeerConnection(remoteNumber);
    }
    
    try {
        // Create offer
        const offer = await state.peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });
        
        // Set local description
        await state.peerConnection.setLocalDescription(offer);
        
        // Send offer to signaling server
        sendToSignalingServer({
            type: 'offer',
            offer: state.peerConnection.localDescription,
            to: remoteNumber
        });
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

// Clean up peer connection
function cleanupPeerConnection() {
    if (state.peerConnection) {
        state.peerConnection.close();
        state.peerConnection = null;
    }
}

// Clean up WebRTC resources
function cleanupWebRTC() {
    // Clean up peer connection
    cleanupPeerConnection();
    
    // Clean up local stream
    if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
        state.localStream = null;
    }
    
    // Clean up remote stream
    state.remoteStream = null;
    
    // Reset video elements
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
    
    // Stop ringtone if playing
    stopRingtone();
}

// Helper functions
function getInitials(name) {
    if (!name) return '??';
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function formatPhoneNumber(number) {
    // Format as (XXX) XXX-XXXX for US numbers
    const cleaned = ('' + number).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return number;
}

function formatCallTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function formatCallDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    let formattedTime = '';
    
    if (hours > 0) {
        formattedTime += `${hours}:`;
    }
    
    formattedTime += `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    return formattedTime;
}

function getContactNameByNumber(number) {
    const contact = state.contacts.find(c => c.number === number);
    return contact ? contact.name : null;
}

function generateUniqueNumber() {
    // Generate a random 10-digit number (US format)
    return '1' + Math.floor(Math.random() * 9000000000 + 1000000000).toString();
}

// Connect to the WebSocket signaling server
function connectToSignalingServer() {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = protocol + window.location.host;
    
    console.log('Connecting to signaling server at:', wsUrl);
    
    state.websocket = new WebSocket(wsUrl);
    
    state.websocket.onopen = () => {
        console.log('Connected to signaling server');
        state.isSocketConnected = true;
        
        // Login to the signaling server with our user info
        if (state.user) {
            sendToSignalingServer({
                type: 'login',
                number: state.user.number,
                name: state.user.fullName
            });
        }
    };
    
    state.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message from server:', data.type);
        
        switch (data.type) {
            case 'login-response':
                handleLoginResponse(data);
                break;
            case 'user-status':
                handleUserStatus(data);
                break;
            case 'incoming-call':
                handleIncomingCall(data);
                break;
            case 'call-answered':
                handleCallAnswered(data);
                break;
            case 'ice-candidate':
                handleRemoteIceCandidate(data);
                break;
            case 'offer':
                handleRemoteOffer(data);
                break;
            case 'answer':
                handleRemoteAnswer(data);
                break;
            case 'end-call':
                handleRemoteEndCall(data);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    };
    
    state.websocket.onclose = () => {
        console.log('Disconnected from signaling server');
        state.isSocketConnected = false;
        
        // Try to reconnect after a delay
        setTimeout(() => {
            if (state.user) {
                connectToSignalingServer();
            }
        }, 5000);
    };
    
    state.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        state.isSocketConnected = false;
    };
}

// Send message to signaling server
function sendToSignalingServer(data) {
    if (state.websocket && state.isSocketConnected) {
        state.websocket.send(JSON.stringify(data));
    } else {
        console.error('Cannot send message: WebSocket not connected');
    }
}

// Handle login response from server
function handleLoginResponse(data) {
    console.log('Login response:', data);
    if (data.success) {
        console.log('Successfully logged in to signaling server');
    } else {
        console.error('Failed to login to signaling server:', data.message);
    }
}

// Handle user status updates
function handleUserStatus(data) {
    const { number, online } = data;
    
    if (online) {
        state.onlineUsers.add(number);
    } else {
        state.onlineUsers.delete(number);
    }
    
    // Update UI to show online status for contacts
    updateContactsOnlineStatus();
}

// Update contacts UI to show online status
function updateContactsOnlineStatus() {
    const contactItems = document.querySelectorAll('.contact-item');
    
    contactItems.forEach(item => {
        const numberElement = item.querySelector('.contact-info p');
        if (numberElement) {
            const number = numberElement.textContent.replace(/\D/g, '');
            const statusIndicator = item.querySelector('.status-indicator') || document.createElement('div');
            
            if (!statusIndicator.classList.contains('status-indicator')) {
                statusIndicator.className = 'status-indicator';
                item.querySelector('.contact-info').appendChild(statusIndicator);
            }
            
            statusIndicator.className = 'status-indicator';
            if (state.onlineUsers.has(number)) {
                statusIndicator.classList.add('online');
                statusIndicator.title = 'Online';
            } else {
                statusIndicator.classList.add('offline');
                statusIndicator.title = 'Offline';
            }
        }
    });
}

// Handle incoming call from server
function handleIncomingCall(data) {
    console.log('Incoming call from:', data.from, data.fromName);
    
    // Store current call information
    state.currentCall = {
        number: data.from,
        name: data.fromName || getContactNameByNumber(data.from) || 'Unknown',
        direction: 'incoming',
        withVideo: false
    };
    
    // Update incoming call alert
    if (incomingCallerName) incomingCallerName.textContent = state.currentCall.name;
    if (incomingCallerNumber) incomingCallerNumber.textContent = formatPhoneNumber(state.currentCall.number);
    if (incomingCallerInitials) incomingCallerInitials.textContent = getInitials(state.currentCall.name);
    
    // Show incoming call alert
    if (incomingCallAlert) incomingCallAlert.classList.remove('hidden');
    
    // Play ringtone
    playRingtone();
}

// Handle call answered response
function handleCallAnswered(data) {
    console.log('Call answered:', data);
    
    // If call was accepted, create and send an offer
    if (data.accepted) {
        updateCallStatus('Call accepted, establishing connection...');
        
        // Create WebRTC offer
        createAndSendOffer(state.currentCall.number);
    } else {
        // Call was rejected
        updateCallStatus('Call rejected');
        
        // Add to call history
        addCallHistory({
            number: state.currentCall.number,
            direction: 'outgoing',
            type: 'rejected',
            timestamp: Date.now(),
            duration: 0
        });
        
        // Clean up and return to main screen after a delay
        setTimeout(() => {
            cleanupWebRTC();
            state.currentCall = null;
            showScreen(mainScreen);
        }, 1500);
    }
}

// Handle remote ICE candidate
function handleRemoteIceCandidate(data) {
    console.log('Received remote ICE candidate');
    
    if (state.peerConnection && data.candidate) {
        try {
            state.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
                .catch(error => console.error('Error adding received ice candidate', error));
        } catch (error) {
            console.error('Error adding received ice candidate', error);
        }
    }
}

// Handle remote offer
async function handleRemoteOffer(data) {
    console.log('Received remote offer');
    
    if (!state.peerConnection) {
        // Create new peer connection
        createPeerConnection(state.currentCall.number);
    }
    
    try {
        // Set remote description
        await state.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Create answer
        const answer = await state.peerConnection.createAnswer();
        await state.peerConnection.setLocalDescription(answer);
        
        // Send answer back
        sendToSignalingServer({
            type: 'answer',
            answer: state.peerConnection.localDescription,
            to: state.currentCall.number
        });
    } catch (error) {
        console.error('Error handling remote offer:', error);
    }
}

// Handle remote answer
async function handleRemoteAnswer(data) {
    console.log('Received remote answer');
    
    if (state.peerConnection) {
        try {
            await state.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (error) {
            console.error('Error setting remote description:', error);
        }
    }
}

// Handle remote end call
function handleRemoteEndCall(data) {
    console.log('Remote peer ended the call');
    
    // Update UI
    updateCallStatus('Call ended by remote peer');
    
    // End the call on our side
    endCall();
}

// Play ringtone
function playRingtone() {
    // Create audio element for ringtone
    const ringtone = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_c518b68cfd.mp3?filename=deduction-528.mp3');
    ringtone.loop = true;
    ringtone.play().catch(error => console.error('Error playing ringtone:', error));
    
    // Store ringtone reference for stopping later
    state.ringtone = ringtone;
    
    // Stop ringtone after 30 seconds if not answered
    setTimeout(() => {
        stopRingtone();
    }, 30000);
}

// Stop ringtone
function stopRingtone() {
    if (state.ringtone) {
        state.ringtone.pause();
        state.ringtone.currentTime = 0;
        state.ringtone = null;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// For demo purposes: Add a function to trigger incoming call simulation
window.simulateIncomingCall = simulateIncomingCall; 