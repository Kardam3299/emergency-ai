/**
 * CrisisIQ - AI Crisis Decision Engine
 * Main Application Module
 */

// ==================== STATE MANAGEMENT ====================
const AppState = {
    apiKey: localStorage.getItem('geminiApiKey') || '',
    recognition: null,
    uploadedImageBase64: null,
    userLocation: null,
    userId: localStorage.getItem('userId') || generateUserId(),
    userName: localStorage.getItem('userName') || '',
    userContact: localStorage.getItem('userContact') || '',
    db: null, // IndexedDB instance
    emergencyMap: null // Leaflet map instance
};

// Generate unique user ID
function generateUserId() {
    const id = 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', id);
    return id;
}

// ==================== DATABASE INITIALIZATION ====================
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CrisisIQDatabase', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            AppState.db = request.result;
            resolve(AppState.db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object store for crisis reports
            if (!db.objectStoreNames.contains('crisisReports')) {
                const store = db.createObjectStore('crisisReports', { keyPath: 'id', autoIncrement: true });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('crisisType', 'crisisType', { unique: false });
            }
        };
    });
}

// Save crisis report to database
async function saveCrisisReport(reportData) {
    if (!AppState.db) {
        await initializeDatabase();
    }
    
    const transaction = AppState.db.transaction(['crisisReports'], 'readwrite');
    const store = transaction.objectStore('crisisReports');
    
    const report = {
        userId: AppState.userId,
        userName: AppState.userName,
        userContact: AppState.userContact,
        userLocation: AppState.userLocation,
        timestamp: new Date().toISOString(),
        crisisType: reportData.crisisType,
        severityLevel: reportData.severityLevel,
        summary: reportData.summary,
        description: reportData.description || '',
        image: reportData.image || null,
        voice: reportData.voice || null,
        latitude: AppState.userLocation?.latitude || null,
        longitude: AppState.userLocation?.longitude || null,
        accuracy: AppState.userLocation?.accuracy || null
    };
    
    return new Promise((resolve, reject) => {
        const request = store.add(report);
        request.onsuccess = () => {
            console.log('Crisis report saved with ID:', request.result);
            alert('✓ Your crisis report has been saved with ID: ' + request.result);
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
}

// Retrieve all crisis reports for current user
async function getUserReports() {
    if (!AppState.db) {
        await initializeDatabase();
    }
    
    const transaction = AppState.db.transaction(['crisisReports'], 'readonly');
    const store = transaction.objectStore('crisisReports');
    const index = store.index('userId');
    
    return new Promise((resolve, reject) => {
        const request = index.getAll(AppState.userId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Save user information
function saveUserInfo(name, contact) {
    AppState.userName = name.trim();
    AppState.userContact = contact.trim();
    localStorage.setItem('userName', AppState.userName);
    localStorage.setItem('userContact', AppState.userContact);
}

// Show user info modal
function showUserInfoModal() {
    const modal = document.getElementById('userInfoModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('inputName').value = AppState.userName;
        document.getElementById('inputContact').value = AppState.userContact;
    }
}

function closeUserInfoModal() {
    const modal = document.getElementById('userInfoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Show/Hide Resources Modal
function showResourcesModal() {
    const modal = document.getElementById('resourcesModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeResourcesModal() {
    const modal = document.getElementById('resourcesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function submitUserInfo() {
    const name = document.getElementById('inputName').value.trim();
    const contact = document.getElementById('inputContact').value.trim();
    
    if (!name || !contact) {
        alert('Please enter your name and contact number');
        return;
    }
    
    saveUserInfo(name, contact);
    closeUserInfoModal();
    alert('✓ Your information has been saved');
}

// ==================== STATE MANAGEMENT ====================

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize database
    initializeDatabase().catch(err => console.error('Database initialization failed:', err));
    
    if (AppState.apiKey) {
        document.getElementById('apiKey').value = AppState.apiKey;
        // Update button appearance for saved key
        const saveBtn = document.querySelector('.save-key');
        saveBtn.innerHTML = 'API Key Saved ✓';
        saveBtn.style.background = 'linear-gradient(135deg, #238636 0%, #2ea043 100%)';
    } else {
        // Highlight demo button when no API key is set
        const demoBtn = document.getElementById('demoBtn');
        demoBtn.innerHTML = '🎯 Try Demo Mode (No API Key Needed)';
        demoBtn.style.animation = 'pulse 2s infinite';
    }
    updateApiStatus();
});

function updateApiStatus() {
    const statusIndicator = document.getElementById('apiStatus');
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');

    if (AppState.apiKey) {
        statusIndicator.className = 'status-indicator api-configured';
        statusText.textContent = 'API Key Configured';
    } else {
        statusIndicator.className = 'status-indicator api-missing';
        statusText.textContent = 'API Key Not Configured';
    }
}

function toggleSettings() {
    const settingsPanel = document.querySelector('.settings');
    const toggleBtn = document.querySelector('.settings-toggle');
    if (!settingsPanel) return;

    const isVisible = settingsPanel.style.display === 'block' || settingsPanel.classList.contains('open');

    if (isVisible) {
        settingsPanel.style.display = 'none';
        settingsPanel.classList.remove('open');
        if (toggleBtn) toggleBtn.textContent = '⚙️ API Settings';
    } else {
        settingsPanel.style.display = 'block';
        settingsPanel.classList.add('open');
        if (toggleBtn) toggleBtn.textContent = '✖ Close API Settings';
        document.getElementById('apiKey').focus();
    }
}

function saveApiKey() {
    AppState.apiKey = document.getElementById('apiKey').value.trim();
    localStorage.setItem('geminiApiKey', AppState.apiKey);

    const checkmark = document.getElementById('keySaved');
    checkmark.style.display = 'inline';
    checkmark.classList.add('bounceIn');

    // Update button text to show status
    const saveBtn = document.querySelector('.save-key');
    if (AppState.apiKey) {
        saveBtn.innerHTML = '<span style="color: #56d364; margin-right: 8px;">✓</span>API Key Saved';
        saveBtn.style.background = 'linear-gradient(135deg, #238636 0%, #2ea043 100%)';
    } else {
        saveBtn.innerHTML = 'Save API Key';
        saveBtn.style.background = 'linear-gradient(135deg, #6e7681 0%, #8b949e 100%)';
    }

    updateApiStatus();

    updateApiStatus();

    setTimeout(() => {
        checkmark.style.display = 'none';
        checkmark.classList.remove('bounceIn');
        saveBtn.innerHTML = AppState.apiKey ? 'API Key Saved ✓' : 'Save API Key';

        // Update demo button appearance
        const demoBtn = document.getElementById('demoBtn');
        if (AppState.apiKey) {
            demoBtn.innerHTML = '🎯 Demo Mode';
            demoBtn.style.animation = '';
        } else {
            demoBtn.innerHTML = '🎯 Try Demo Mode (No API Key Needed)';
            demoBtn.style.animation = 'pulse 2s infinite';
        }
    }, 2000);
}

// ==================== IMAGE HANDLING ====================
function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('imageUploadSection').classList.add('dragging');
}

function handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('imageUploadSection').classList.remove('dragging');
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('imageUploadSection').classList.remove('dragging');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            processImageFile(file);
        } else {
            alert('Please upload an image file.');
        }
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Compress image to max 1024px width/height to ensure it fits in API limits
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max_size = 1024;

            if (width > height) {
                if (width > max_size) {
                    height *= max_size / width;
                    width = max_size;
                }
            } else {
                if (height > max_size) {
                    width *= max_size / height;
                    height = max_size;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG with 0.8 quality for good compression
            AppState.uploadedImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            const previewImg = document.getElementById('photoPreview');
            previewImg.src = AppState.uploadedImageBase64;
            previewImg.style.display = 'block';
            document.getElementById('photoFileName').textContent = '✓ ' + file.name + ' (compressed) loaded';
            document.getElementById('photoFileName').style.color = '#56d364';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==================== VOICE INPUT ====================
function startVoiceInput() {
    // If already running, stop it
    if (AppState.recognition && AppState.isVoiceInputActive) {
        AppState.recognition.stop();
        AppState.isVoiceInputActive = false;
        return;
    }

    if (!('webkitSpeechRecognition' in window)) {
        alert('Voice input not supported in this browser.');
        return;
    }

    AppState.recognition = new webkitSpeechRecognition();
    AppState.recognition.continuous = true; 
    AppState.recognition.interimResults = true; 
    AppState.recognition.lang = 'en-US';

    AppState.recognition.onstart = function() {
        AppState.isVoiceInputActive = true;
        document.getElementById('micBtn').classList.add('recording');
        document.getElementById('micBtn').innerHTML = '🛑 Stop Listening';
    };

    AppState.recognition.onresult = function(event) {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        document.getElementById('crisisInput').value = transcript;
    };

    AppState.recognition.onend = function() {
        AppState.isVoiceInputActive = false;
        document.getElementById('micBtn').classList.remove('recording');
        document.getElementById('micBtn').innerHTML = '🎤 Voice Input';
    };

    AppState.recognition.onerror = function(event) {
        console.error('Voice input error:', event.error);
        AppState.isVoiceInputActive = false;
    };

    AppState.recognition.start();
}

// ==================== LOCATION SERVICES ====================
function getUserLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '📍 Getting location...';

    navigator.geolocation.getCurrentPosition(
        function(position) {
            AppState.userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            displayLocationInfo();
            findNearbyPlaces();
            btn.disabled = false;
            btn.textContent = '📍 Get My Location & Nearby Help';
        },
        function(error) {
            let message = 'Could not get location. ';
            if (error.code === error.PERMISSION_DENIED) {
                message += 'Please enable location access in your browser settings.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message += 'Location information is unavailable.';
            } else {
                message += 'Please try again.';
            }
            alert(message);
            btn.disabled = false;
            btn.textContent = '📍 Get My Location & Nearby Help';
        }
    );
}

function displayLocationInfo() {
    if (!AppState.userLocation) return;

    const locationDisplay = document.getElementById('locationDisplay');
    locationDisplay.innerHTML = `
        <div class="location-info">
            <h4>📍 Your Location</h4>
            <div class="location-details">
                <strong>Latitude:</strong> ${AppState.userLocation.latitude.toFixed(4)} <br>
                <strong>Longitude:</strong> ${AppState.userLocation.longitude.toFixed(4)} <br>
                <strong>Accuracy:</strong> ±${AppState.userLocation.accuracy.toFixed(0)} meters
            </div>
            <div id="nearbyPlacesContainer"></div>
        </div>
    `;
    locationDisplay.style.display = 'block';
    
    // Display map container immediately
    const mapDiv = document.getElementById('map');
    if (mapDiv) mapDiv.style.display = 'block';
}

async function findNearbyPlaces() {
    if (!AppState.userLocation) return;

    const lat = AppState.userLocation.latitude;
    const lon = AppState.userLocation.longitude;

    try {
        const placesContainer = document.getElementById('nearbyPlacesContainer');
        placesContainer.innerHTML = '<div class="location-details">Searching for nearby emergency services...</div>';

        // Prepare Map
        if (AppState.emergencyMap !== null) {
            AppState.emergencyMap.remove();
        }
        
        // Ensure map div is visible and has height before initializing
        const mapDiv = document.getElementById('map');
        mapDiv.style.display = 'block';
        
        // Initialize map
        AppState.emergencyMap = L.map('map').setView([lat, lon], 14);
        
        // Add OpenStreetMap tiles (darker theme approximation via CSS or standard OSM)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(AppState.emergencyMap);
        
        // Plot User Location (Red Marker)
        const userIcon = L.divIcon({
            className: 'custom-user-marker',
            html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(239,68,68,0.8);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        L.marker([lat, lon], {icon: userIcon}).addTo(AppState.emergencyMap)
            .bindPopup('<b>You are here</b>').openPopup();

        const types = [
            { type: 'hospital', query: 'node[amenity=hospital];node[amenity=clinic];' },
            { type: 'police', query: 'node[amenity=police];' },
            { type: 'fire', query: 'node[amenity=fire_station];' },
            { type: 'ambulance', query: 'node[emergency=ambulance_station];' }
        ];

        let allPlaces = [];

        for (const typeObj of types) {
            const overpassQuery = `
                [bbox=${lat-0.05},${lon-0.05},${lat+0.05},${lon+0.05}];
                (${typeObj.query});
                out center;
            `;

            try {
                const response = await fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    body: overpassQuery
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.elements) {
                        data.elements.forEach(el => {
                            const distance = calculateDistance(lat, lon, el.lat, el.lon);
                            allPlaces.push({
                                name: el.tags?.name || typeObj.type.toUpperCase(),
                                type: typeObj.type,
                                lat: el.lat,
                                lon: el.lon,
                                distance: distance
                            });
                        });
                    }
                }
            } catch (err) {
                console.error(`Error fetching ${typeObj.type}:`, err);
            }
        }

        const grouped = {
            hospital: [],
            police: [],
            fire: [],
            ambulance: []
        };

        allPlaces.forEach(place => {
            if (grouped[place.type] && grouped[place.type].length < 3) {
                grouped[place.type].push(place);
            }
        });

        const topPlaces = [
            ...grouped.hospital.sort((a, b) => a.distance - b.distance),
            ...grouped.police.sort((a, b) => a.distance - b.distance),
            ...grouped.fire.sort((a, b) => a.distance - b.distance),
            ...grouped.ambulance.sort((a, b) => a.distance - b.distance)
        ].slice(0, 10);

        if (topPlaces.length === 0) {
            placesContainer.innerHTML = `
                <div class="nearby-places">
                    <div class="place-item">No nearby services found in OSM database. Using default emergency numbers.</div>
                </div>
            `;
        } else {
            let html = '<div class="nearby-places"><strong style="color: #ff4444;">Nearest Emergency Services:</strong>';
            topPlaces.forEach(place => {
                const typeIcon = {
                    hospital: '🏥',
                    police: '🚓',
                    fire: '🚒',
                    ambulance: '🚑'
                }[place.type] || '📍';
                html += `<div class="place-item">
                    <span class="place-type">${typeIcon} ${place.name}</span>
                    <span class="place-distance">${place.distance.toFixed(1)} km away</span>
                </div>`;
                
                // Plot on Map
                const markerColor = place.type === 'hospital' || place.type === 'ambulance' ? '#3b82f6' : (place.type === 'fire' ? '#f97316' : '#22c55e');
                const placeIcon = L.divIcon({
                    className: 'custom-place-marker',
                    html: `<div style="background-color: ${markerColor}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });
                L.marker([place.lat, place.lon], {icon: placeIcon}).addTo(AppState.emergencyMap)
                    .bindPopup(`<b style="color:${markerColor}">${typeIcon} ${place.name}</b><br>${place.distance.toFixed(2)} km away`);
            });
            html += '</div>';
            placesContainer.innerHTML = html;
        }
        
    } catch (error) {
        console.error('Error finding nearby places:', error);
        document.getElementById('nearbyPlacesContainer').innerHTML = '<div class="location-details" style="color: #ff8800;">⚠️ Could not load nearby services. Using emergency contact numbers instead.</div>';
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ==================== LANGUAGE DETECTION ====================
function detectLanguage(text) {
    // Check for Devanagari script (Hindi)
    const devanagariRegex = /[\u0900-\u097F]/g;
    const devanagariMatches = text.match(devanagariRegex);
    
    if (devanagariMatches && devanagariMatches.length > 3) {
        return 'hindi'; // Primarily Hindi
    }
    
    // Check for common Hinglish patterns - more comprehensive
    // These are common Hindi words used in Hinglish
    const hinglishPatterns = /\b(police|hospital|aaj|kal|yeh|woh|kya|kaise|kab|kahan|really|bhai|sir|madam|please|urgently|jaldi|dhyan|dekhlo|karo|karna|hai|hain|kar|diya|logon|accident|fire|patient|doctor|ambulance|injured|road|fir|abhi|phir|jao|ana|raha|rahi|laga|mara|kaat|phone|call|video|message|whatsapp|photo|image|show|dikha|dikhao|batao|suno|suna|likha|likho|kahi|kahe|hota|hoti|hote|tha|thi|the|kar|ke|ki|ka|ko|ek|aur|do|teen|char|paanch|ek|do|ho|hun|hai|tha|tha|raha|aaya|gaya|aa|ja|le|de|lo|do|ban|mil|sun|bol|likh|pad|dekh|samajh|sun|pooch|pata|sure|clear|yes|no|ok|theek|galat)\b/i;
    
    if (hinglishPatterns.test(text)) {
        return 'hinglish'; // Hinglish (Hindi + English mix)
    }
    
    return 'english'; // Default to English
}

// ==================== EXAMPLE SCENARIOS ====================
function loadExample(text) {
    document.getElementById('crisisInput').value = text;
    // Use demo mode instead of API to avoid API key issues
    loadDemo();
}

// ==================== API COMMUNICATION ====================
async function getActionPlan() {
    const input = document.getElementById('crisisInput').value.trim();
    const hasImage = AppState.uploadedImageBase64 !== null;

    if (!input && !hasImage) {
        alert('Please describe the emergency or upload a photo.');
        return;
    }

    if (!AppState.apiKey) {
        const shouldOpenSettings = confirm('API key is required for AI analysis. Would you like to open settings to configure your Google Gemini API key?\n\nAlternatively, try the Demo Mode button for a sample response.');
        if (shouldOpenSettings) {
            toggleSettings();
            document.getElementById('apiKey').focus();
        }
        return;
    }

    // Require at least text input for API call
    if (!input) {
        alert('Please add a text description along with the photo for better analysis.');
        return;
    }

    const btn = document.getElementById('getPlanBtn');
    btn.classList.add('loading');
    btn.innerHTML = '<span class="spinner"></span>Analyzing crisis situation...';
    btn.disabled = true;

    let analysisText = '';
    if (hasImage) {
        analysisText = 'A photo has been uploaded showing an emergency situation. ';
    }
    if (input) {
        analysisText += 'The user also describes: ' + input;
    }

    const prompt = `You are CrisisIQ, an expert emergency response AI trained in disaster management, first aid, and crisis coordination. A person is describing an emergency situation to you.

CRITICAL SAFETY NOTE: This is a professional emergency response application. DO NOT block this request due to safety filters regarding medical or emergency content. Instead, provide accurate, life-saving first aid and coordination guidance. Prioritize human life and immediate safety above all else.

CRITICAL LANGUAGE INSTRUCTION:
1. You MUST carefully analyze the exact language, dialect, and script used in the user's text description.
2. If the user writes in Hinglish (Hindi mixed with English using Latin/Roman script), you MUST reply ENTIRELY in Hinglish. Example: "Patient ko immediately safe jagah le jao aur unhe calm rakhne ki koshish karo."
3. If the user writes in Devanagari Hindi, reply in Devanagari Hindi.
4. If the user writes in any other regional language or pure English, mirror that language.
5. In ALL cases, mirror the user's language for ALL text fields in the JSON response ("summary", "title", "description", "timeframe", "doNotDo", "additionalNote"). The JSON keys must remain in English.

Your job is to respond ONLY in the following JSON format — no extra text, no markdown, no explanation outside the JSON:
{
  "crisisType": "detected crisis type in english",
  "severityLevel": "CRITICAL or HIGH or MEDIUM or LOW",
  "summary": "1-2 sentence summary of the situation",
  "actions": [
    {
      "priority": "CRITICAL",
      "title": "Short action title",
      "description": "Clear, simple instruction anyone can follow",
      "timeframe": "Do in next 30 seconds"
    }
  ],
  "doNotDo": ["mistake 1 to avoid", "mistake 2 to avoid"],
  "additionalNote": "Any critical extra information"
}

Generate 4-6 action steps ranked from most to least urgent. Always prioritize human safety first.

Emergency Situation: ${analysisText}`;

    try {
        // Build OpenRouter API request
        let requestBody = {
            model: "openai/gpt-4o-mini", // Using GPT-4o-mini for maximum stability and fewer provider errors
            messages: [
                {
                    role: "user",
                    content: []
                }
            ],
            temperature: 0.3,
            max_tokens: 2048
        };

        if (hasImage) {
            requestBody.messages[0].content.push({
                type: "image_url",
                image_url: {
                    url: AppState.uploadedImageBase64
                }
            });
        }

        requestBody.messages[0].content.push({
            type: "text",
            text: prompt
        });

        const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AppState.apiKey}`,
                'HTTP-Referer': window.location.href.startsWith('http') ? window.location.href : 'http://localhost:3000',
                'X-Title': 'CrisisIQ'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
            console.error('OpenRouter API Error:', errorData);
            throw new Error(`OpenRouter API Error: ${errorMessage}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
            throw new Error('No response returned from the model.');
        }

        const textResponse = data.choices[0].message.content;

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(textResponse);
        } catch (e) {
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonResponse = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Invalid response format');
            }
        }

        displayResults(jsonResponse);

    } catch (error) {
        let errorMsg = error.message;
        if (errorMsg.includes('API key')) {
            errorMsg = 'Invalid Gemini API key. Please check your settings.';
        } else if (errorMsg.includes('quota') || errorMsg.includes('429')) {
            errorMsg = 'API quota exceeded. Please check your billing details or try again later.';
        }

        // Display error in UI instead of alert
        const outputSection = document.getElementById('outputSection');
        const crisisSummary = document.getElementById('crisisSummary');
        const actionsDiv = document.getElementById('actions');
        const doNotDoDiv = document.getElementById('doNotDo');
        const additionalNoteDiv = document.getElementById('additionalNote');
        
        outputSection.style.display = 'block';
        crisisSummary.innerHTML = `
            <div class="severity-banner severity-critical" style="background-color: #ef4444; color: white;">
                ⚠️ Error Performing AI Analysis
            </div>
            <p style="color: #ffb8b8;">${errorMsg}</p>
        `;
        actionsDiv.innerHTML = '';
        doNotDoDiv.style.display = 'none';
        additionalNoteDiv.style.display = 'none';

        console.error('Full AI Error:', error);
    } finally {
        btn.classList.remove('loading');
        btn.innerHTML = 'Get Action Plan';
        btn.disabled = false;
    }
}

// ==================== UI DISPLAY ====================
function displayResults(data) {
    const outputSection = document.getElementById('outputSection');
    const crisisSummary = document.getElementById('crisisSummary');
    const actionsDiv = document.getElementById('actions');
    const doNotDoDiv = document.getElementById('doNotDo');
    const additionalNoteDiv = document.getElementById('additionalNote');

    if (typeof data === 'string') {
        // New guidance format
        crisisSummary.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit; background-color: #0d1117; padding: 15px; border-radius: 5px; color: #c9d1d9;">${data}</pre>`;
        actionsDiv.innerHTML = '';
        doNotDoDiv.style.display = 'none';
        additionalNoteDiv.style.display = 'none';

        // Save crisis report to database
        const reportData = {
            crisisType: 'Guidance',
            severityLevel: 'N/A',
            summary: data.substring(0, 200) + '...',
            description: document.getElementById('crisisInput').value,
            image: AppState.uploadedImageBase64,
            voice: null
        };
        saveCrisisReport(reportData).catch(err => console.error('Failed to save report:', err));
    } else {
        // Old format (for compatibility)
        // Save crisis report to database
        const reportData = {
            crisisType: data.crisisType,
            severityLevel: data.severityLevel,
            summary: data.summary,
            description: document.getElementById('crisisInput').value,
            image: AppState.uploadedImageBase64,
            voice: null
        };
        saveCrisisReport(reportData).catch(err => console.error('Failed to save report:', err));

        // Crisis Summary
        crisisSummary.innerHTML = `
            <div class="severity-banner severity-${data.severityLevel.toLowerCase()}">
                ${data.crisisType} - ${data.severityLevel} SEVERITY
            </div>
            <p>${data.summary}</p>
            ${AppState.userLocation ? `<div style="margin-top: 10px; padding: 10px; background-color: #0d1117; border-radius: 5px; font-size: 0.9rem; color: #c9d1d9;">📍 <strong>Your Location:</strong> ${AppState.userLocation.latitude.toFixed(4)}, ${AppState.userLocation.longitude.toFixed(4)}</div>` : ''}
        `;

        // Actions
        actionsDiv.innerHTML = '';
        data.actions.forEach((action, index) => {
            const actionCard = document.createElement('div');
            actionCard.className = 'action-card';
            actionCard.innerHTML = `
                <div class="action-header">
                    <span class="priority-badge priority-${action.priority.toLowerCase()}">${action.priority}</span>
                    <span class="step-number">${index + 1}</span>
                    <div>
                        <div class="action-title">${action.title}</div>
                    </div>
                </div>
                <div class="action-description">${action.description}</div>
                <div class="timeframe">${action.timeframe}</div>
            `;
            actionsDiv.appendChild(actionCard);
        });

        // Do Not Do
        if (data.doNotDo && data.doNotDo.length > 0) {
            doNotDoDiv.innerHTML = `
                <h4>⚠️ DO NOT DO</h4>
                <ul>
                    ${data.doNotDo.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `;
            doNotDoDiv.style.display = 'block';
        } else {
            doNotDoDiv.style.display = 'none';
        }

        // Additional Note
        if (data.additionalNote) {
            additionalNoteDiv.innerHTML = `<h4>Additional Information</h4><p>${data.additionalNote}</p>`;
            additionalNoteDiv.style.display = 'block';
        } else {
            additionalNoteDiv.style.display = 'none';
        }
    }

    outputSection.style.display = 'block';
    outputSection.scrollIntoView({ behavior: 'smooth' });
}

// ==================== REPORTS MANAGEMENT ====================
async function viewSavedReports() {
    try {
        const reports = await getUserReports();
        const reportsModal = document.getElementById('reportsModal');
        const reportsList = document.getElementById('reportsList');
        
        if (!reports || reports.length === 0) {
            reportsList.innerHTML = '<div class="empty-message">📭 No crisis reports saved yet. Your reports will appear here.</div>';
        } else {
            const html = reports.map(report => {
                const date = new Date(report.timestamp);
                const timeStr = date.toLocaleString('en-IN');
                
                return `
                    <div class="report-item">
                        <div class="report-item-header">
                            <div class="report-item-title">${report.crisisType}</div>
                            <span class="severity-badge-small severity-${report.severityLevel.toLowerCase()}-small">${report.severityLevel}</span>
                        </div>
                        <div class="report-item-detail"><strong>Time:</strong> ${timeStr}</div>
                        <div class="report-item-detail"><strong>Summary:</strong> ${report.summary.substring(0, 100)}...</div>
                        <div class="report-item-detail"><strong>Location:</strong> ${report.latitude && report.longitude ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}` : 'Not recorded'}</div>
                        ${report.userName ? `<div class="report-item-detail"><strong>Reported By:</strong> ${report.userName}</div>` : ''}
                        ${report.userContact ? `<div class="report-item-detail"><strong>Contact:</strong> ${report.userContact}</div>` : ''}
                    </div>
                `;
            }).reverse().join('');
            
            reportsList.innerHTML = html;
        }
        
        reportsModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading reports:', error);
        alert('Error loading reports: ' + error.message);
    }
}

function closeReportsModal() {
    const modal = document.getElementById('reportsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const userInfoModal = document.getElementById('userInfoModal');
    const reportsModal = document.getElementById('reportsModal');
    
    if (event.target === userInfoModal) {
        userInfoModal.style.display = 'none';
    }
    if (event.target === reportsModal) {
        reportsModal.style.display = 'none';
    }
}

// ==================== DEMO MODE ====================
function loadDemo() {
    // Use current input or load a default scenario
    let demoText = document.getElementById('crisisInput').value.trim();
    
    if (!demoText) {
        // If no input, load a default kitchen fire scenario
        demoText = "Kitchen fire in a restaurant, heavy smoke filling the building, 15 customers and 5 staff members trapped inside, fire started from cooking oil, emergency exits blocked by flames, people showing signs of smoke inhalation";
        document.getElementById('crisisInput').value = demoText;
    }

    // Detect language and show demo response based on the current input
    const detectedLanguage = detectLanguage(demoText);
    showDemoResponse(demoText, detectedLanguage);
}

// Classify situation into categories
function classifySituation(text) {
    const lower = text.toLowerCase();
    if (lower.includes('fire') || lower.includes('aag') || lower.includes('आग') || lower.includes('accident') || lower.includes('collision') || lower.includes('crash') || lower.includes('medical') || lower.includes('collapsed') || lower.includes('breathing') || lower.includes('heart') || lower.includes('hospital') || lower.includes('flood') || lower.includes('water') || lower.includes('drowning') || lower.includes('nahal') || lower.includes('explosion') || lower.includes('chemical') || lower.includes('injury') || lower.includes('bleeding') || lower.includes('unconscious')) {
        return 'Emergency';
    } else if (lower.includes('fraud') || lower.includes('harassment') || lower.includes('salary') || lower.includes('rights') || lower.includes('complaint') || lower.includes('legal') || lower.includes('police') || lower.includes('court') || lower.includes('theft') || lower.includes('cyber') || lower.includes('crime')) {
        return 'Legal';
    } else if (lower.includes('relationship') || lower.includes('stress') || lower.includes('depression') || lower.includes('anxiety') || lower.includes('family') || lower.includes('friend') || lower.includes('personal') || lower.includes('mental') || lower.includes('suicide') || lower.includes('emotional') || lower.includes('breakup')) {
        return 'Personal';
    } else {
        return 'General';
    }
}

function showDemoResponse(situationText, language = 'english') {
    // Classify the situation
    const category = classifySituation(situationText);
    
    // Generate guidance based on category and language
    let demoResponse;
    
    if (language === 'hindi') {
        demoResponse = getHindiGuidance(category, situationText);
    } else {
        demoResponse = getEnglishGuidance(category, situationText);
    }

    displayResults(demoResponse);
}

function getEnglishGuidance(category, situationText) {
    const guidances = {
        'Emergency': `---
📌 Situation Type: Emergency
⚠️ Priority: HIGH

✅ What to do:
1. Call emergency services immediately (Ambulance: 108, Police: 100, Fire: 101)
2. Ensure your safety and move to a secure location
3. Provide basic first aid if you are trained and it is safe
4. Stay calm and wait for professional help

📞 Important Contacts:
- Ambulance: 108
- Police: 100
- Fire: 101

💡 Additional Guidance:
- Assess the situation quickly but safely
- Do not put yourself or others in more danger
- Help others if possible without risking your life

⚠️ Disclaimer:
This is general guidance and not professional or legal advice.
---`,
        'Legal': `---
📌 Situation Type: Legal
⚠️ Priority: MEDIUM

✅ What to do:
1. You may have rights under relevant laws
2. File a complaint with the appropriate authorities
3. Contact legal aid services or a lawyer
4. Document all evidence and keep records

📞 Important Contacts:
- Cyber Crime Helpline: 1930 (if cyber-related)
- Local Police Station: 100
- Legal Aid Services

💡 Additional Guidance:
- Seek professional legal advice for your specific situation
- Keep all communications and evidence safe
- Do not confront the other party directly

⚠️ Disclaimer:
This is general guidance and not professional or legal advice.
---`,
        'Personal': `---
📌 Situation Type: Personal
⚠️ Priority: LOW

✅ What to do:
1. Talk to a trusted friend or family member
2. Take time to understand your feelings
3. Consider professional counseling if needed
4. Focus on self-care and healthy activities

📞 Important Contacts:
- Mental Health Helpline: 9152987821 (iCall)
- Family/Friends

💡 Additional Guidance:
- It's okay to ask for help
- Take small steps towards solving the problem
- Maintain a routine and healthy habits

⚠️ Disclaimer:
This is general guidance and not professional or legal advice.
---`,
        'General': `---
📌 Situation Type: General
⚠️ Priority: LOW

✅ What to do:
1. Break down the problem into smaller parts
2. Gather information and research options
3. Talk to people who have faced similar situations
4. Make a plan and take action step by step

📞 Important Contacts:
- Local helpline or community services

💡 Additional Guidance:
- Stay calm and think clearly
- Use available resources and tools
- Don't hesitate to seek advice from experts

⚠️ Disclaimer:
This is general guidance and not professional or legal advice.
---`
    };

    return guidances[category] || guidances['General'];
}

function getHinglishDemoResponse(crisisType, situationText) {
    const demoResponses = {
        'Fire': {
            "crisisType": "आग की आपातकालीन स्थिति",
            "severityLevel": "CRITICAL",
            "summary": `आग लगी हुई है: ${situationText.substring(0, 100)}... लोगों की जान मे खतरा है।`,
            "actions": [
                {"priority": "CRITICAL", "title": "फौरन निकल भागो", "description": "सब लोगों को सबसे करीبी रास्ते से बाहर निकालो। धुएं से बचने के लिए नीचे झुक जाओ। पहले बुजुर्गों और बच्चों को निकालो।", "timeframe": "30 सेकंड में करो"},
                {"priority": "CRITICAL", "title": "आग बुझाने वालों को कॉल करो (101)", "description": "फौरन 101 डायल करो। सही जगह, लोगों की संख्या और आग का साइज बताओ।", "timeframe": "1 मिनट में करो"},
                {"priority": "HIGH", "title": "आग बुझाने की कोशिश करो", "description": "अगर ट्रेनिंग शुदा हो और आग छोटी हो तो बिल्कुल करना। वरना निकल जाओ।", "timeframe":"2 मिनट में करो"},
                {"priority": "HIGH", "title": "गिनती करो", "description": "बाहर निकले सब लोगों की गिनती करो। कोई गायब हो तो फौरन बता देना।", "timeframe": "5 मिनट में करो"}
            ],
            "doNotDo": ["अंदर वापस ना जाना", "लिफ्ट का इस्तेमाल ना करना", "बड़ी आग से खुद लड़ना ना चलेगा", "पानी से तेल की आग बुझाना ना"],
            "additionalNote": "[डेमो] API सेट करने से बेहतर गाइडेंस मिलेगी। आग बुझाने वाले: 101"
        },
        'Medical': {
            "crisisType": "मेडिकल इमर्जेंसी",
            "severityLevel": "CRITICAL",
            "summary": `मेडिकल इमर्जेंसी: ${situationText.substring(0, 100)}... फौरन सहायता चाहिए।`,
            "actions": [
                {"priority": "CRITICAL", "title": "एंबुलेंस बुलाओ (108)", "description": "फौरन 108 डायल करो। लक्षण, जगह और मरीज की उम्र बताओ।", "timeframe": "फौरन करो"},
                {"priority": "CRITICAL", "title": "चेक करो", "description": "आंखें खोल रहा है? सांस ले रहा है? सीने को देखो।", "timeframe": "10 सेकंड में"},
                {"priority": "CRITICAL", "title": "CPR दो", "description": "अगर बेहोश है और सांस नहीं, सीने पर 100-120 बार दबाओ।", "timeframe": "फौरन करो"},
                {"priority": "HIGH", "title": "साइड में रखो", "description": "अगर बेहोश है पर सांस ले रहा तो साइड में रखो।", "timeframe": "1 मिनट में"}
            ],
            "doNotDo": ["मरीज को हिलाना ना", "बेहोश को खाना-पानी ना देना", "अकेला छोड़ कर ना जाना", "घबराना ना"],
            "additionalNote": "[डेमो] बेहतर सलाह के लिए API सेट करो। एंबुलेंस: 108"
        },
        'Flood': {
            "crisisType": "बाढ़ की आपातकालीन स्थिति",
            "severityLevel": "HIGH",
            "summary": `बाढ़ आ रही है: ${situationText.substring(0, 100)}... ऊंची जगह पर चले जाओ।`,
            "actions": [
                {"priority": "CRITICAL", "title": "ऊंची जगह पर जाओ", "description": "सब लोगों के साथ सबसे ऊंची जगह पर फौरन चले जाओ।", "timeframe": "फौरन करो"},
                {"priority": "CRITICAL", "title": "इमर्जेंसी को कॉल करो (112)", "description": "112 डायल करो। जगह और लोगों की संख्या बताओ।", "timeframe": "फौरन करो"},
                {"priority": "HIGH", "title": "जरूरी सामान निकालो", "description": "पानी, दवाई, फोन, जरूरी कागजात और टॉर्च निकाल लो।", "timeframe": "5 मिनट में"},
                {"priority": "HIGH", "title": "बिजली-गैस बंद करो", "description": "अगर सुरक्षित हो तो मेन से बिजली रक गैस बंद कर दो।", "timeframe": "जाने से पहले"}
            ],
            "doNotDo": ["बाढ़ का पानी पार करने की कोशिश ना करना", "बहते पानी में ना जाना", "नीचली मंजिल में ना रहना", "सामान जमा करते हुए जान ना गंवाना"],
            "additionalNote": "[डेमो] API सेट करो बेहतर गाइडेंस के लिए। इमर्जेंसी: 112"
        },
        'Road Accident': {
            "crisisType": "सड़क हादसा",
            "severityLevel": "HIGH",
            "summary": `सड़क का हादसा हुआ: ${situationText.substring(0, 100)}... जख्मी हो सकते हैं।`,
            "actions": [
                {"priority": "CRITICAL", "title": "पुलिस और एंबुलेंस बुलाओ", "description": "पुलिस के लिए 100 और एंबुलेंस के लिए 108 डायल करो। जगह और जख्मों की डिटेल्स बताओ।", "timeframe": "फौरन करो"},
                {"priority": "HIGH", "title": "सुरक्षित जगह पर जाओ", "description": "जख्मियों को गाड़ियों से दूर ले जाओ।", "timeframe": "30 सेकंड में"},
                {"priority": "HIGH", "title": "चेक करो", "description": "खून बह रहा है? हड्डी टूटी है? बेहोश हो तो?", "timeframe": "फौरन करो"},
                {"priority": "MEDIUM", "title": "फर्स्ट एड दो", "description": "खून को कपड़े से रोको। टूटी हड्डी को सहारा दो।", "timeframe": "मदद आने तक"}
            ],
            "doNotDo": ["बहुत जख्मी को हिलाना ना", "हेलमेट निकालना ना", "जगह से जाना ना", "तेल या तरल को छूना ना"],
            "additionalNote": "[डेमो] गाइडेंस के लिए API सेट करो। पुलिस: 100, एंबुलेंस: 108"
        },
        'Mental Health': {
            "crisisType": "मानसिक स्वास्थ्य संकट",
            "severityLevel": "HIGH",
            "summary": `मानसिक संकट: ${situationText.substring(0, 100)}... सहायता चाहिए।`,
            "actions": [
                {"priority": "CRITICAL", "title": "iCall को कॉल करो", "description": "9152987821 पर कॉल करो। 24 घंटे मदद मिलती है।", "timeframe": "फौरन करो"},
                {"priority": "HIGH", "title": "सुनो", "description": "व्यक्ति को सब कुछ बताने दो। प्यार दिखाओ।", "timeframe": "ध्यान से सुनते रहो"},
                {"priority": "HIGH", "title": "सुरक्षित रखो", "description": "नुकसान पहुंचाने वाली चीजें दूर करो। सुरक्षित जगह प्रदान करो।", "timeframe": "फौरन करो"},
                {"priority": "HIGH", "title": "साथ रहो", "description": "अकेला ना छोड़ो। साथ में रहो।", "timeframe": "मदद आने तक"}
            ],
            "doNotDo": ["भावनाओं को अनदेखा ना करना", "अकेला ना छोड़ना", "बहस या नुक्स ना करना", "दर्द को छोटा ना समझना"],
            "additionalNote": "[डेमो] बेहतर मदद के लिए API सेट करो। iCall: 9152987821"
        },
        'Other': {
            "crisisType": "इमर्जेंसी स्थिति",
            "severityLevel": "HIGH",
            "summary": `आपातकालीन स्थिति: ${situationText.substring(0, 100)}... मदद चाहिए।`,
            "actions": [
                {"priority": "CRITICAL", "title": "112 पर कॉल करो", "description": "फौरन 112 डायल कर दो। स्थिति साफ बता दो।", "timeframe": "फौरन करो"},
                {"priority": "HIGH", "title": "स्थिति समझो", "description": "जख्मी हैं? खतरे में हैं?", "timeframe": "30 सेकंड में"},
                {"priority": "HIGH", "title": "सुरक्षित जगह जाओ", "description": "खतरे से दूर हो जाओ।", "timeframe": "फौरन करो"},
                {"priority": "MEDIUM", "title": "डिटेल्स नोट करो", "description": "बताने के लिए जानकारी याद रखो।", "timeframe": "जब तक इंतजाऱ करो"}
            ],
            "doNotDo": ["इमर्जेंसी को नज़र अंदाज ना करना", "देर ना करना", "अपने आप को खतरे में ना डालना", "बचाव दल में बाधा ना डालना"],
            "additionalNote": "[डेमो] विस्तार से सलाह के लिए API सेट करो। इमर्जेंसी: 112"
        }
    };

    return demoResponses[crisisType] || demoResponses['Other'];
}

function getHindiDemoResponse(crisisType, situationText) {
    // Full Hindi responses in Devanagari script
    const demoResponses = {
        'Fire': {
            "crisisType": "आग की आपातकालीन स्थिति",
            "severityLevel": "CRITICAL",
            "summary": `आग की समस्या: ${situationText.substring(0, 100)}... लोगों के जीवन को तत्काल खतरा है।`,
            "actions": [
                {"priority": "CRITICAL", "title": "तत्काल निकासी", "description": "सभी लोगों को निकटतम सुरक्षित रास्ते से बाहर निकालें। धुएं से बचने के लिए झुककर चलें। बुजुर्गों और बच्चों को पहले निकालें।", "timeframe": "30 सेकंड में करें"},
                {"priority": "CRITICAL", "title": "अग्निशमन सेवा को कॉल करें (101)", "description": "तुरंत 101 डायल करें। सटीक स्थान, लोगों की संख्या और आग का आकार बताएं।", "timeframe": "1 मिनट में करें"},
                {"priority": "HIGH", "title": "अग्निशामक यंत्र का उपयोग करें", "description": "यदि प्रशिक्षित हैं और आग छोटी है तो करें। अन्यथा तत्काल निकल जाएं।", "timeframe": "2 मिनट में करें"},
                {"priority": "HIGH", "title": "गिनती और रिपोर्ट करें", "description": "निकाले गए सभी लोगों की गिनती करें। किसी के अभाव की तुरंत सूचना दें।", "timeframe": "5 मिनट में करें"}
            ],
            "doNotDo": ["अंदर वापस न जाएं", "आग के समय लिफ्ट का उपयोग न करें", "बड़ी आग से स्वयं लड़ाई न करें", "तेल की आग पर पानी न डालें"],
            "additionalNote": "[डेमो मोड] API सेटअप के लिए बेहतर विश्लेषण उपलब्ध है। अग्निशमन: 101"
        },
        'Medical': {
            "crisisType": "चिकित्सा आपातकालीन",
            "severityLevel": "CRITICAL",
            "summary": `चिकित्सा आपातकालीन: ${situationText.substring(0, 100)}... तत्काल चिकित्सा हस्तक्षेप आवश्यक है।`,
            "actions": [
                {"priority": "CRITICAL", "title": "एम्बुलेंस बुलाएं (108)", "description": "तुरंत 108 डायल करें। लक्षण, स्थान और रोगी की आयु बताएं।", "timeframe": "तत्काल करें"},
                {"priority": "CRITICAL", "title": "जागरूकता और श्वास जांचें", "description": "कंधे को टैप करें और देखें कि व्यक्ति प्रतिक्रिया दे रहा है या नहीं। छाती की गति देखें।", "timeframe": "10 सेकंड में करें"},
                {"priority": "CRITICAL", "title": "सीपीआर शुरू करें", "description": "यदि बेहोश है और सांस नहीं ले रहा है, तो व्यक्ति को सपाट रखें और छाती पर 100-120 बार दबाएं।", "timeframe": "तत्काल करें"},
                {"priority": "HIGH", "title": "रिकवरी पोजीशन", "description": "यदि सांस ले रहा है पर बेहोश है, तो उसे करवट से रखें।", "timeframe": "1 मिनट में करें"}
            ],
            "doNotDo": ["रोगी को अनावश्यक रूप से हिलाएं न", "बेहोश को भोजन या पानी न दें", "रोगी को अकेला न छोड़ें", "घबराएं न, शांत रहें"],
            "additionalNote": "[डेमो मोड] विस्तृत मार्गदर्शन के लिए Gemini API सेटअप करें। एम्बुलेंस: 108"
        },
        'Flood': {
            "crisisType": "बाढ़ की आपातकालीन स्थिति",
            "severityLevel": "HIGH",
            "summary": `बाढ़ की स्थिति: ${situationText.substring(0, 100)}... ऊंची जमीन पर जाएं।`,
            "actions": [
                {"priority": "CRITICAL", "title": "ऊंची भूमि पर जाएं", "description": "सभी लोगों को तुरंत सबसे ऊंची जगह पर ले जाएं। देर न करें।", "timeframe": "तत्काल करें"},
                {"priority": "CRITICAL", "title": "आपातकालीन सेवा को कॉल करें (112)", "description": "112 डायल करें। स्थान और लोगों की संख्या बताएं।", "timeframe": "तत्काल करें"},
                {"priority": "HIGH", "title": "आपूर्ति एकत्र करें", "description": "पानी, दवाएं, फोन, महत्वपूर्ण दस्तावेज और टॉर्च निकालें।", "timeframe": "5 मिनट में करें"},
                {"priority": "HIGH", "title": "उपयोगिताओं को बंद करें", "description": "यदि सुरक्षित हो तो गैस और बिजली मुख्य से बंद करें।", "timeframe": "निकासी से पहले"}
            ],
            "doNotDo": ["बाढ़ के पानी से ड्राइव न करें", "बहते पानी में न जाएं", "निचली मंजिलों में न रहें", "जीवन जोखिम में न डालें"],
            "additionalNote": "[डेमो मोड] बेहतर मार्गदर्शन के लिए API सेटअप करें। आपातकालीन: 112"
        },
        'Road Accident': {
            "crisisType": "सड़क दुर्घटना",
            "severityLevel": "HIGH",
            "summary": `सड़क दुर्घटना: ${situationText.substring(0, 100)}... जख्मों की संभावना है।`,
            "actions": [
                {"priority": "CRITICAL", "title": "पुलिस और एम्बुलेंस बुलाएं", "description": "पुलिस के लिए 100 और एम्बुलेंस के लिए 108 डायल करें। सटीक स्थान और जख्मों की जानकारी दें।", "timeframe": "तत्काल करें"},
                {"priority": "HIGH", "title": "सुरक्षित क्षेत्र में जाएं", "description": "यदि सुरक्षित है तो घायलों को ट्रैफिक से दूर ले जाएं।", "timeframe": "30 सेकंड में करें"},
                {"priority": "HIGH", "title": "जख्मों की जांच करें", "description": "खून बहना, टूटी हुई हड्डियां या बेहोशी की जांच करें।", "timeframe": "तत्काल करें"},
                {"priority": "MEDIUM", "title": "प्राथमिक चिकित्सा दें", "description": "खून को कपड़े से रोकें। टूटी हड्डियों को स्थिर करें।", "timeframe": "मदद आने का इंतजार करते हुए"}
            ],
            "doNotDo": ["गंभीर रूप से घायलों को न हिलाएं", "हेलमेट निकालने का प्रयास न करें", "दुर्घटना स्थल न छोड़ें", "ईंधन या द्रव को न छुएं"],
            "additionalNote": "[डेमो मोड] विस्तृत सहायता के लिए API सेटअप करें। पुलिस: 100, एम्बुलेंस: 108"
        },
        'Mental Health': {
            "crisisType": "मानसिक स्वास्थ्य संकट",
            "severityLevel": "HIGH",
            "summary": `मानसिक स्वास्थ्य संकट: ${situationText.substring(0, 100)}... तुरंत समर्थन आवश्यक है।`,
            "actions": [
                {"priority": "CRITICAL", "title": "iCall या परामर्शदाता को कॉल करें", "description": "9152987821 पर तुरंत कॉल करें। iCall 24/7 मानसिक स्वास्थ्य सहायता प्रदान करती है।", "timeframe": "तत्काल करें"},
                {"priority": "HIGH", "title": "बिना निर्णय के सुनें", "description": "व्यक्ति को अपनी भावनाएं व्यक्त करने दें। सहानुभूति दिखाएं।", "timeframe": "निरंतर करते रहें"},
                {"priority": "HIGH", "title": "सुरक्षा सुनिश्चित करें", "description": "हानिकारक वस्तुओं तक पहुंच हटाएं। सुरक्षित वातावरण प्रदान करें।", "timeframe": "तत्काल करें"},
                {"priority": "HIGH", "title": "साथ रहें", "description": "व्यक्ति को अकेला न छोड़ें। उपस्थित रहें और सहायक हों।", "timeframe": "मदद आने तक"}
            ],
            "doNotDo": ["भावनाओं को खारिज न करें", "व्यक्ति को अकेला न छोड़ें", "बहस या आलोचना न करें", "दर्द को कम न आंकें"],
            "additionalNote": "[डेमो मोड] व्यावहारिक मार्गदर्शन के लिए API सेटअप करें। iCall: 9152987821"
        },
        'Other': {
            "crisisType": "आपातकालीन स्थिति",
            "severityLevel": "HIGH",
            "summary": `आपातकालीन स्थिति: ${situationText.substring(0, 100)}... तुरंत पेशेवर मदद चाहिए।`,
            "actions": [
                {"priority": "CRITICAL", "title": "आपातकालीन कॉल करें (112)", "description": "112 डायल करकर आपातकालीन प्रेषण तक पहुंचें। स्थिति स्पष्ट रूप से बताएं।", "timeframe": "तत्काल करें"},
                {"priority": "HIGH", "title": "स्थिति का आकलन करें", "description": "शीघ्रता से निर्धारित करें कि कोई घायल है या तत्काल खतरे में है।", "timeframe": "30 सेकंड में करें"},
                {"priority": "HIGH", "title": "सुरक्षित क्षेत्र में जाएं", "description": "खतरे से दूर एक सुरक्षित स्थान जाएं।", "timeframe": "तत्काल करें"},
                {"priority": "MEDIUM", "title": "जानकारी एकत्र करें", "description": "आपातकालीन सेवाओं के साथ साझा करने के लिए विवरण नोट करें।", "timeframe": "प्रतीक्षा करते समय"}
            ],
            "doNotDo": ["आपातकालीन को अनदेखा न करें", "मदद बुलाने में देरी न करें", "अपने आप को खतरे में न डालें", "बचाव कार्यों में बाधा न डालें"],
            "additionalNote": "[डेमो मोड] विशिष्ट मार्गदर्शन के लिए API सेटअप करें। आपातकालीन हॉटलाइन: 112"
        }
    };

    return demoResponses[crisisType] || demoResponses['Other'];
}

// ==================== HIGH EMERGENCY DETECTION ====================

// Detect if situation is HIGH EMERGENCY based on keywords and severity
function detectHighEmergency(text, severityLevel, crisisType) {
    const lowerText = text.toLowerCase();
    
    // Check for critical keywords indicating immediate danger
    const criticalKeywords = [
        'fire', 'aag', 'आग', 'burning', 'blaze', 'smoke',
        'accident', 'crash', 'collision', 'hit', 'collision',
        'drowning', 'nahal', 'डूब', 'water',
        'explosion', 'blast', 'bomb', 'bombing',
        'collapse', 'building fell', 'structure failed',
        'unconscious', 'not breathing', 'no pulse', 'heart stopped',
        'bleeding', 'blood', 'injured', 'hurt', 'wound',
        'trapped', 'stuck', 'unable to escape', 'trapped inside',
        'chemical', 'gas leak', 'toxic', 'hazardous',
        'electrocution', 'shock', 'burn',
        'shooting', 'attack', 'assault', 'violence',
        'overdose', 'poison', 'toxic'
    ];
    
    // Check severity level
    if (severityLevel === 'CRITICAL' || severityLevel === 'HIGH') {
        return true;
    }
    
    // Check for critical keywords
    for (const keyword of criticalKeywords) {
        if (lowerText.includes(keyword)) {
            return true;
        }
    }
    
    // Check crisis type
    const emergencyTypes = ['Fire', 'Medical', 'Road Accident', 'Flood', 'Industrial'];
    if (emergencyTypes.includes(crisisType)) {
        return true;
    }
    
    return false;
}

// Determine appropriate emergency service based on crisis type
function getEmergencyService(crisisType, text) {
    const lowerText = text.toLowerCase();
    
    // Fire emergency
    if (crisisType === 'Fire' || lowerText.includes('fire') || lowerText.includes('aag') || lowerText.includes('आग') || lowerText.includes('burning') || lowerText.includes('blaze')) {
        return {
            service: 'Fire Department',
            number: '101',
            icon: '🚒',
            recommendation: 'Call Fire Department immediately - 101'
        };
    }
    
    // Medical emergency
    if (crisisType === 'Medical' || lowerText.includes('medical') || lowerText.includes('hospital') || lowerText.includes('unconscious') || lowerText.includes('not breathing') || lowerText.includes('heart') || lowerText.includes('injured') || lowerText.includes('bleeding')) {
        return {
            service: 'Ambulance',
            number: '108',
            icon: '🚑',
            recommendation: 'Call Ambulance immediately - 108'
        };
    }
    
    // Road accident
    if (crisisType === 'Road Accident' || lowerText.includes('accident') || lowerText.includes('crash') || lowerText.includes('collision') || lowerText.includes('road')) {
        return {
            service: 'Police + Ambulance',
            number: '100 / 108',
            icon: '🚓',
            recommendation: 'Call Police (100) and Ambulance (108)'
        };
    }
    
    // Flood/Water emergency
    if (crisisType === 'Flood' || lowerText.includes('flood') || lowerText.includes('water') || lowerText.includes('drowning') || lowerText.includes('nahal')) {
        return {
            service: 'National Emergency + Fire',
            number: '112 / 101',
            icon: '🌊',
            recommendation: 'Call National Emergency - 112'
        };
    }
    
    // Industrial/Chemical
    if (crisisType === 'Industrial' || lowerText.includes('chemical') || lowerText.includes('explosion') || lowerText.includes('gas leak')) {
        return {
            service: 'Fire + Hazmat',
            number: '112 / 101',
            icon: '⚠️',
            recommendation: 'Call National Emergency - 112'
        };
    }
    
    // Default to national emergency
    return {
        service: 'National Emergency',
        number: '112',
        icon: '📞',
        recommendation: 'Call National Emergency - 112'
    };
}

// Show emergency banner with recommended action
function showEmergencyBanner(crisisType, text) {
    const emergencyService = getEmergencyService(crisisType, text);
    const banner = document.getElementById('emergencyBanner');
    
    if (banner) {
        banner.innerHTML = `
            <div class="emergency-content">
                <span class="emergency-icon">🚨</span>
                <span class="emergency-text">HIGH EMERGENCY DETECTED</span>
                <div style="color: white; font-size: 0.9rem;">
                    ${emergencyService.icon} ${emergencyService.recommendation}
                </div>
                <button class="emergency-action-btn" onclick="triggerEmergencyCall('${emergencyService.number}')">
                    📞 Call ${emergencyService.service}
                </button>
            </div>
        `;
        banner.style.display = 'block';
        
        // Auto-scroll to banner
        banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Hide emergency banner
function hideEmergencyBanner() {
    const banner = document.getElementById('emergencyBanner');
    if (banner) {
        banner.style.display = 'none';
    }
}

// Trigger emergency call
function triggerEmergencyCall(number) {
    // Try to make a phone call
    window.location.href = 'tel:' + number;
    
    // Show confirmation
    alert(`Calling ${number}... \n\nIf this is not a real emergency, please hang up.`);
}

// ==================== IMAGE EMERGENCY DETECTION ====================

// Analyze uploaded image for emergency indicators
function analyzeImageForEmergency(imageBase64) {
    // This is a client-side basic analysis
    // In production, you would use the Gemini API to analyze the image
    
    // Check if image was uploaded
    if (!imageBase64) {
        return null;
    }
    
    // Basic visual indicators (in a real app, this would use AI vision)
    // For demo purposes, we'll return null and let the API handle it
    return null;
}

// Detect emergency from image (called when image is uploaded)
function detectEmergencyFromImage() {
    if (AppState.uploadedImageBase64) {
        // Image has been uploaded
        // The actual analysis will be done by the Gemini API when getActionPlan is called
        // But we can show a preliminary warning
        
        const imageSection = document.getElementById('imageUploadSection');
        if (imageSection) {
            // Add visual indicator that image will be analyzed
            const existingWarning = imageSection.querySelector('.image-warning');
            if (!existingWarning) {
                const warning = document.createElement('div');
                warning.className = 'image-warning';
                warning.innerHTML = '📷 Image uploaded - will be analyzed for emergency indicators';
                warning.style.cssText = 'color: #ff8800; font-size: 0.85rem; margin-top: 8px; padding: 8px; background: rgba(255,136,0,0.1); border-radius: 6px;';
                imageSection.appendChild(warning);
            }
        }
    }
}

// Enhanced display results with emergency detection
function displayResultsWithEmergencyCheck(data) {
    // First display the results normally
    displayResults(data);
    
    // Then check for high emergency
    let crisisType = 'Other';
    let severityLevel = 'MEDIUM';
    let text = document.getElementById('crisisInput').value || '';
    
    if (typeof data === 'object' && data !== null) {
        crisisType = data.crisisType || 'Other';
        severityLevel = data.severityLevel || 'MEDIUM';
    }
    
    // Check if HIGH EMERGENCY
    if (detectHighEmergency(text, severityLevel, crisisType)) {
        showEmergencyBanner(crisisType, text);
    } else {
        hideEmergencyBanner();
    }
}

// Override the original getActionPlan to use enhanced display
const originalGetActionPlan = getActionPlan;
getActionPlan = async function() {
    // Call original function
    await originalGetActionPlan();
    
    // After results are displayed, check for emergency
    // This is handled in displayResults now
};

// Override displayResults to include emergency check
const originalDisplayResults = displayResults;
displayResults = function(data) {
    originalDisplayResults(data);
    
    // Check for high emergency after displaying
    let crisisType = 'Other';
    let severityLevel = 'MEDIUM';
    let text = document.getElementById('crisisInput').value || '';
    
    if (typeof data === 'object' && data !== null) {
        crisisType = data.crisisType || 'Other';
        severityLevel = data.severityLevel || 'MEDIUM';
        
        // Also check actions for CRITICAL priority
        if (data.actions && Array.isArray(data.actions)) {
            const hasCriticalAction = data.actions.some(action => 
                action.priority && action.priority.toUpperCase() === 'CRITICAL'
            );
            if (hasCriticalAction) {
                severityLevel = 'CRITICAL';
            }
        }
    }
    
    // Check if HIGH EMERGENCY
    if (detectHighEmergency(text, severityLevel, crisisType)) {
        showEmergencyBanner(crisisType, text);
    } else {
        hideEmergencyBanner();
    }
};

// Add image upload handler enhancement
const originalProcessImageFile = processImageFile;
processImageFile = function(file) {
    originalProcessImageFile(file);
    // Detect emergency from newly uploaded image
    detectEmergencyFromImage();
};

// ==================== API COMMUNICATION ====================
