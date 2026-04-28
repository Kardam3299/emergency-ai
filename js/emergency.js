// js/emergency.js

// ==================== FIREBASE CONFIG ====================
// Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDeS9PPq9FQ2OKcgmXeQQbFCV4-pmgeoPE",
  authDomain: "emergency-ai-14aa1.firebaseapp.com",
  projectId: "emergency-ai-14aa1",
  storageBucket: "emergency-ai-14aa1.firebasestorage.app",
  messagingSenderId: "540809173359",
  appId: "1:540809173359:web:9b7be3b57f19cd4490709a",
  measurementId: "G-L8QQ1Z5ZB5"
};

// ==================== STATE VARIABLES ====================
// State variables for Emergency Mode
let emergencyStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let emergencyTimeout = null;
let recordedBlob = null; // Store the recorded video blob
let firebaseApp = null;
let storage = null;

// Required UI Elements (to be retrieved when DOM is ready)
let liveAssistUI;
let cameraFeed;
let recordingStatusText;

document.addEventListener('DOMContentLoaded', () => {
    liveAssistUI = document.getElementById('liveAssistUI');
    cameraFeed = document.getElementById('cameraFeed');
    recordingStatusText = document.getElementById('recordingStatusText');
    
    // Initialize Firebase
    initializeFirebase();
});

// Initialize Firebase App
function initializeFirebase() {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        try {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            storage = firebaseApp.storage();
            console.log("Firebase initialized successfully");
        } catch (e) {
            console.warn("Firebase not configured. Using local download only.", e);
        }
    } else {
        firebaseApp = firebase.apps[0];
        storage = firebaseApp.storage();
    }
}

// 1. Show the Emergency Confirmation Modal
function confirmEmergencyMode() {
    const modal = document.getElementById('emergencyConfirmModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeEmergencyConfirmModal() {
    const modal = document.getElementById('emergencyConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 2. Start Emergency Mode based on user choice
async function startEmergencyMode(enableRecording) {
    closeEmergencyConfirmModal();

    if (enableRecording) {
        showLiveAssistUI();
        await startCamera();
        
        // Also trigger location
        if (typeof getUserLocation === 'function') {
            getUserLocation();
        }
    } else {
        // Only call emergency services
        alert("Emergency services have been simulated notified. Location shared.");
        if (typeof getUserLocation === 'function') {
            getUserLocation();
        }
    }
}

// Show the live assist overlay
function showLiveAssistUI() {
    if (liveAssistUI) {
        liveAssistUI.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // prevent scrolling
    }
}

// Hide the live assist overlay
function hideLiveAssistUI() {
    if (liveAssistUI) {
        liveAssistUI.style.display = 'none';
        document.body.style.overflow = 'auto'; // restore scrolling
    }
}

// 3. Start Camera Access
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        emergencyStream = stream;
        
        if (cameraFeed) {
            cameraFeed.srcObject = stream;
            cameraFeed.play();
        }

        // Auto-start recording for demo
        startRecording();

    } catch (err) {
        console.error("Camera access denied or failed:", err);
        alert("Camera or Microphone permission denied. Unable to start live assist feature.");
        hideLiveAssistUI();
    }
}

// 4. Start Recording
function startRecording() {
    if (!emergencyStream) return;

    recordedChunks = [];
    // Note: Safari may require video/mp4, but video/webm works for most Chromium/Firefox
    mediaRecorder = new MediaRecorder(emergencyStream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        // Store the recorded blob for upload
        recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
        const videoURL = URL.createObjectURL(recordedBlob);
        showDownloadLink(videoURL);
        
        // Auto-upload to Firebase if configured
        if (recordedBlob && firebaseApp) {
            uploadToCloud(recordedBlob);
        }
    };

    mediaRecorder.start();
    
    // Update UI indicator
    if (recordingStatusText) {
        recordingStatusText.innerText = "Recording in progress...";
        document.getElementById('recordingIndicator').style.display = 'inline-block';
    }
    
    if (typeof showToast === 'function') {
        showToast('Recording is running...', true);
    }

    // Auto-stop recording after 15 seconds for demonstration purposes
    emergencyTimeout = setTimeout(() => {
        stopRecording();
    }, 15000);
}

// 5. Stop Recording & Clean Up
function stopRecording(isManual = false) {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }

    // Stop all media tracks to turn off the camera light
    if (emergencyStream) {
        emergencyStream.getTracks().forEach(track => track.stop());
        emergencyStream = null;
    }

    if (cameraFeed) {
        // freeze the last frame by pausing, not setting to null, looks better
        cameraFeed.pause(); 
    }

    if (emergencyTimeout) {
        clearTimeout(emergencyTimeout);
    }
    
    if (isManual) {
         hideLiveAssistUI();
         if (cameraFeed) cameraFeed.srcObject = null;
    } else {
        if (recordingStatusText) {
            recordingStatusText.innerText = "Recording stopped. Evidence secured.";
            document.getElementById('recordingIndicator').style.display = 'none';
        }
    }
    if (typeof hideToast === 'function') hideToast();
}

// Stop Everything (Manual Exit)
function cancelEmergencyMode() {
    stopRecording(true);
}

// Generate the download link dynamically
function showDownloadLink(url) {
    const actionsContainer = document.getElementById('emergencyActionsContainer');
    if (!actionsContainer) return;
    
    // Remove if there's an old one
    const oldBtn = document.getElementById('downloadEvidenceBtn');
    if (oldBtn) oldBtn.remove();

    // Create download button
    const a = document.createElement("a");
    a.href = url;
    a.id = "downloadEvidenceBtn";
    a.download = `Crisis_Evidence_${new Date().getTime()}.webm`;
    a.className = "analyze-btn blue-glow";
    a.style.marginTop = "15px";
    a.style.textAlign = "center";
    a.style.display = "block";
    a.style.textDecoration = "none";
    a.innerHTML = "📥 Download Evidence Recording";
    
    actionsContainer.appendChild(a);
}

// ==================== FIREBASE CLOUD UPLOAD ====================

/**
 * Upload recorded evidence to Firebase Cloud Storage
 * @param {Blob} blob - The recorded video blob
 */
function uploadToCloud(blob) {
    if (!storage) {
        console.warn("Firebase Storage not initialized");
        return;
    }

    const actionsContainer = document.getElementById('emergencyActionsContainer');
    if (!actionsContainer) return;

    // Create upload status element
    const uploadStatus = document.createElement('div');
    uploadStatus.id = 'uploadStatus';
    uploadStatus.style.cssText = 'margin-top: 15px; padding: 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; text-align: center;';
    uploadStatus.innerHTML = '<p style="color: #60a5fa; margin: 0;">☁️ Uploading to cloud...</p>';
    actionsContainer.appendChild(uploadStatus);

    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const userId = AppState.userId || 'anonymous';
    const fileName = `evidence_${userId}_${timestamp}.webm`;
    
    // Get storage reference
    const storageRef = storage.ref('emergency_evidence');
    const fileRef = storageRef.child(fileName);

    // Upload the file
    const uploadTask = fileRef.put(blob);

    uploadTask.on('state_changed', 
        // Progress callback
        (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            uploadStatus.innerHTML = `<p style="color: #60a5fa; margin: 0;">☁️ Uploading... ${progress}%</p>`;
        },
        // Error callback
        (error) => {
            console.error("Upload failed:", error);
            uploadStatus.innerHTML = `<p style="color: #ef4444; margin: 0;">❌ Upload failed: ${error.message}</p>`;
        },
        // Complete callback
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                console.log("File available at:", downloadURL);
                
                // Store the cloud URL for later use
                AppState.lastEvidenceURL = downloadURL;
                AppState.lastEvidenceFileName = fileName;
                
                uploadStatus.innerHTML = `
                    <p style="color: #34d399; margin: 0 0 10px 0;">✅ Evidence uploaded to cloud!</p>
                    <p style="color: #a1a1aa; font-size: 0.85rem; margin: 0;">📎 Cloud URL saved (share with authorities)</p>
                `;
                
                // Add "Copy Link" button
                const copyLinkBtn = document.createElement('button');
                copyLinkBtn.className = 'analyze-btn';
                copyLinkBtn.style.cssText = 'margin-top: 10px; padding: 10px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.5);';
                copyLinkBtn.innerHTML = '📋 Copy Cloud Link';
                copyLinkBtn.onclick = () => {
                    navigator.clipboard.writeText(downloadURL);
                    copyLinkBtn.innerHTML = '✅ Copied!';
                    setTimeout(() => copyLinkBtn.innerHTML = '📋 Copy Cloud Link', 2000);
                };
                uploadStatus.appendChild(copyLinkBtn);
            });
        }
    );
}

/**
 * Manual upload function (if user wants to upload later)
 */
function uploadLastRecording() {
    if (recordedBlob) {
        uploadToCloud(recordedBlob);
    } else {
        alert("No recorded evidence available to upload.");
    }
}

// ====================
// NOTE: The download button for evidence will ALWAYS be shown to the user.
// If Firebase Storage is configured and available, evidence is uploaded to the cloud as well.
// If not, users can still download the video locally. This ensures evidence is never lost.
// ====================

// ==================== AI-Powered Emergency Guidance ====================
function sendChatbotMessage() {
    const input = document.getElementById('chatbotInput').value;
    const messages = document.getElementById('chatbotMessages');

    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = document.createElement('div');
    userMessage.className = 'user-message';
    userMessage.innerText = input;
    messages.appendChild(userMessage);

    // Simulate AI response
    const botMessage = document.createElement('div');
    botMessage.className = 'bot-message';
    botMessage.innerText = 'Processing your request...';
    messages.appendChild(botMessage);

    // Simulate delay for AI response
    setTimeout(() => {
        botMessage.innerText = `Here is some guidance for: "${input}"`;
    }, 2000);

    document.getElementById('chatbotInput').value = '';
}

function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');
    chatbot.style.display = chatbot.style.display === 'none' ? 'block' : 'none';
}

// ==================== Accessibility Features ====================
function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
}

function toggleLargeText() {
    document.body.classList.toggle('large-text');
}

// ==================== Incident Timeline ====================
function addToTimeline(event) {
    const timelineList = document.getElementById('timelineList');
    const listItem = document.createElement('li');
    listItem.innerText = `${new Date().toLocaleTimeString()}: ${event}`;
    timelineList.appendChild(listItem);
}

// Example usage:
// addToTimeline('Emergency mode activated');

// ==================== Nearby Help Map ====================
function initializeMap() {
    const map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Add a marker for demonstration
    L.marker([51.505, -0.09]).addTo(map)
        .bindPopup('You are here.')
        .openPopup();
}

// ==================== Voice Command Activation ====================
// NOTE: startVoiceInput() is defined in app.js (loaded after this file)
// and handles filling the crisis text input. Do NOT redefine it here.

// ==================== Offline Mode ====================
function saveOffline(blob) {
    const offlineKey = `offline_evidence_${Date.now()}`;
    localStorage.setItem(offlineKey, blob);
    alert('Evidence saved offline. It will be uploaded when online.');
}

window.addEventListener('online', () => {
    // Check for offline evidence and upload
    for (let key in localStorage) {
        if (key.startsWith('offline_evidence_')) {
            const blob = localStorage.getItem(key);
            uploadToCloud(blob);
            localStorage.removeItem(key);
        }
    }
});

// ==================== SMART EMERGENCY TRIGGER SYSTEM ====================

let smartRecognition = null;
let isSmartListening = false;

function toggleSmartListening() {
    if (isSmartListening) {
        stopSmartListening();
    } else {
        startSmartListening();
    }
}

function startSmartListening() {
    // Check browser support first
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('❌ Voice not supported. Use Chrome/Edge.', false);
        alert(
            'Voice recognition is not supported on this browser.\n\n' +
            'Use Google Chrome or Microsoft Edge.\n' +
            'Firefox and Safari do NOT support this feature.'
        );
        return;
    }

    // Check for secure context (HTTPS or localhost) — required for mic access
    if (window.isSecureContext === false || window.location.protocol === 'file:') {
        showToast('❌ Mic requires HTTPS or localhost.', false);
        alert(
            'Voice recognition requires a secure context (HTTPS or localhost).\n\n' +
            'You are currently on: ' + window.location.protocol + '\n\n' +
            'To fix this, serve the page via a local server:\n' +
            '  npx serve .\n' +
            '  or: python -m http.server 8000\n' +
            'Then open http://localhost:8000'
        );
        return;
    }

    // Give immediate visual feedback so the user knows the tap worked
    const btn = document.getElementById('smartListenBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Requesting mic...';
    }
    showToast('⏳ Requesting microphone permission...', false);

    // STEP 1: Explicitly request mic permission via getUserMedia.
    // This is the critical fix for mobile — SpeechRecognition alone often
    // silently fails on Android without triggering the permission dialog.
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
            // Permission granted — stop the stream immediately (we only needed the prompt)
            stream.getTracks().forEach(t => t.stop());
            logSmartStatus('✅ Microphone permission granted.');
            // STEP 2: Now start the actual speech recognition
            _startRecognitionLoop();
        })
        .catch(err => {
            if (btn) { btn.disabled = false; btn.innerHTML = '🎙️ Start Listening (Help)'; }
            hideToast();
            logSmartStatus('❌ Mic permission denied: ' + err.message);
            alert(
                'Microphone access was denied.\n\n' +
                'Please click the lock/info icon in your browser address bar and allow the microphone, then try again.'
            );
        });
}

// Internal function that creates a fresh SpeechRecognition instance and starts it.
// We recreate the object every time because on mobile, reusing a stopped
// recognition object is unreliable and causes silent failures.
function _startRecognitionLoop() {
    // If the user pressed Stop while we were waiting in the 250ms timeout, bail out
    // Note: on the FIRST call, isSmartListening is still false (set by onstart), so
    // we can't use it as a guard here. The onend restart sets isSmartListening check inline.

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    smartRecognition = new SpeechRecognition(); // always a fresh object

    // continuous = false is MORE reliable on mobile.
    // We manually restart in onend to simulate continuous behaviour.
    smartRecognition.continuous = false;
    smartRecognition.interimResults = true; // Immediate feedback — catches "help" instantly
    smartRecognition.lang = 'en-US';
    smartRecognition.maxAlternatives = 3; // Higher accuracy in noisy environments

    smartRecognition.onstart = () => {
        isSmartListening = true;
        const btn = document.getElementById('smartListenBtn');
        if (btn) {
            btn.disabled = false;
            btn.classList.add('listening');
            btn.innerHTML = '🛑 Stop Listening';
        }
        logSmartStatus('🎙️ Mic active — say "help" or "emergency"...');
        showToast('🎙️ Listening for emergency keywords...', false);
    };

    smartRecognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim().toLowerCase();
            
            // Log interim results so the user knows the AI is actually listening
            if (!event.results[i].isFinal) {
                // Use a special prefix for interim to distinguish from final
                logSmartStatus('👂 Thinking: "' + transcript + '..."');
            } else {
                logSmartStatus('🗣️ Heard: "' + transcript + '"');
            }

            // Enhanced keyword detection: regex handles "help", "help help", "emergency", etc.
            // Also added "bachao" (Hindi) and "save" for better coverage.
            const emergencyRegex = /\b(help|emergency|sos|bachao|save|danger|accident|police)\b/i;
            
            if (emergencyRegex.test(transcript)) {
                logSmartStatus('🚨 EMERGENCY DETECTED: "' + transcript + '"');
                isSmartListening = false; 
                stopSmartListening();
                triggerSmartEmergency(true);
                return;
            }
        }
    };

    smartRecognition.onerror = (event) => {
        // 'no-speech' and 'aborted' are normal on mobile — just restart
        if (event.error === 'no-speech' || event.error === 'aborted') {
            return; // onend will handle the restart
        }
        logSmartStatus('❌ Voice Error: ' + event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            stopSmartListening();
            alert('Microphone permission was revoked. Please re-enable it in browser settings.');
        }
    };

    // onend always fires when a session ends (mobile stops after ~5s of silence).
    // Restart the loop automatically if the user hasn’t pressed Stop.
    smartRecognition.onend = () => {
        if (!isSmartListening) return; // user pressed Stop
        // Recreate and restart after a short pause to avoid tight loops
        setTimeout(() => {
            if (isSmartListening) _startRecognitionLoop();
        }, 250);
    };

    try {
        smartRecognition.start();
    } catch (e) {
        console.error('SpeechRecognition start failed:', e);
        logSmartStatus('❌ Could not start mic: ' + e.message);
        const btn = document.getElementById('smartListenBtn');
        if (btn) { btn.disabled = false; btn.innerHTML = '🎙️ Start Listening (Help)'; }
        hideToast();
    }
}

function stopSmartListening() {
    isSmartListening = false;
    if (smartRecognition) {
        try { smartRecognition.stop(); } catch(e) { /* already stopped */ }
    }
    const btn = document.getElementById('smartListenBtn');
    if (btn) {
        btn.classList.remove('listening');
        btn.innerHTML = '🎙️ Start Listening (Help)';
    }
    logSmartStatus('⏸️ Voice listening stopped.');
    hideToast(); // clear the "Listening..." toast
}

// Multi-tap detection
let tapCount = 0;
let tapTimeout = null;

document.addEventListener('click', (e) => {
    // Exclude clicks on existing interactive elements and UI containers to prevent accidental triggers
    // Especially exclude the .smart-status-log itself so tapping it doesn't trigger another emergency
    if (
        e.target.closest('button, a, input, textarea, select, [onclick], .smart-status-log, .modal, .glass-main-grid, nav, .settings, .chatbot') ||
        e.target.isContentEditable
    ) {
        return; 
    }

    tapCount++;
    
    if (tapCount === 1) {
        logSmartStatus('👆 Screen tapped (1/3)');
    } else if (tapCount === 2) {
        logSmartStatus('👆 Screen tapped (2/3)');
    }

    clearTimeout(tapTimeout);
    
    if (tapCount >= 3) {
        logSmartStatus('🚨 3 rapid taps detected!');
        tapCount = 0;
        triggerSmartEmergency(true);
    } else {
        tapTimeout = setTimeout(() => {
            tapCount = 0;
        }, 800); // 800ms window for 3 taps
    }
});

function logSmartStatus(message) {
    const logContainer = document.getElementById('smartStatusLog');
    const msgContainer = document.getElementById('statusMessages');
    
    if (logContainer && msgContainer) {
        logContainer.style.display = 'block';
        const p = document.createElement('p');
        
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        p.innerText = `[${time}] ${message}`;
        
        // Highlight critical messages in red
        if (message.includes('detected') || message.includes('EMERGENCY') || message.includes('INITIATING')) {
            p.style.color = '#fca5a5';
            p.style.fontWeight = '600';
        }

        msgContainer.appendChild(p);
        msgContainer.scrollTop = msgContainer.scrollHeight;
        
        // Keep log visible for 20 seconds during demo
        clearTimeout(window.smartLogTimeout);
        window.smartLogTimeout = setTimeout(() => {
            logContainer.style.display = 'none';
        }, 20000);
    }
}

function triggerSmartEmergency(enableRecording = true) {
    logSmartStatus('🔥 INITIATING EMERGENCY PROTOCOL...');
    
    // Show a prominent "Emergency Detected" toast immediately
    showToast('🚨 Emergency Detected — Activating all systems...', false);

    // 1. Visual Alert: Flash the screen red
    const flashOverlay = document.getElementById('redFlashOverlay');
    if (flashOverlay) {
        flashOverlay.classList.add('active');
        setTimeout(() => { flashOverlay.classList.remove('active'); }, 5000);
    }

    // 2. Haptic vibration (mobile devices)
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 500]);
        logSmartStatus('📱 Haptic vibration triggered.');
    }

    // 3. Simulate demo call after a short delay
    const dialer = document.getElementById('demoDialer');
    if (dialer) {
        logSmartStatus('📞 Calling emergency services (Demo — 112)...');
        setTimeout(() => { dialer.click(); }, 800);
    }

    // 4. Start camera + audio recording + location sharing
    logSmartStatus('📹 Starting video/audio recording...');
    logSmartStatus('📍 Sharing live location...');
    startEmergencyMode(enableRecording);
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, isRecording = false) {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    if(toast && toastMsg) {
        let prefix = isRecording ? '<span class="blinking-dot" style="margin-right: 10px;"></span>' : '';
        toastMsg.innerHTML = prefix + message;
        toast.classList.add('show');
        
        if(!isRecording) {
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    }
}

function hideToast() {
    const toast = document.getElementById('toastNotification');
    if(toast) {
        toast.classList.remove('show');
    }
}

