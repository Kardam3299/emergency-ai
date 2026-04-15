/**
 * CrisisIQ - AI Crisis Decision Engine
 * Main Application Module
 */

// ==================== STATE MANAGEMENT ====================
const AppState = {
    apiKey: localStorage.getItem('geminiApiKey') || '',
    recognition: null,
    uploadedImageBase64: null,
    userLocation: null
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
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
        AppState.uploadedImageBase64 = e.target.result;
        const img = document.getElementById('photoPreview');
        img.src = AppState.uploadedImageBase64;
        img.style.display = 'block';
        document.getElementById('photoFileName').textContent = '✓ ' + file.name + ' loaded';
        document.getElementById('photoFileName').style.color = '#56d364';
    };
    reader.readAsDataURL(file);
}

// ==================== VOICE INPUT ====================
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Voice input not supported in this browser.');
        return;
    }

    AppState.recognition = new webkitSpeechRecognition();
    AppState.recognition.continuous = false;
    AppState.recognition.interimResults = false;
    AppState.recognition.lang = 'en-US';

    AppState.recognition.onstart = function() {
        document.getElementById('micBtn').classList.add('recording');
    };

    AppState.recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('crisisInput').value = transcript;
    };

    AppState.recognition.onend = function() {
        document.getElementById('micBtn').classList.remove('recording');
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
}

async function findNearbyPlaces() {
    if (!AppState.userLocation) return;

    const lat = AppState.userLocation.latitude;
    const lon = AppState.userLocation.longitude;

    try {
        const placesContainer = document.getElementById('nearbyPlacesContainer');
        placesContainer.innerHTML = '<div class="location-details">Searching for nearby emergency services...</div>';

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
            if (grouped[place.type].length < 3) {
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

// ==================== EXAMPLE SCENARIOS ====================
function loadExample(text) {
    document.getElementById('crisisInput').value = text;
    getActionPlan();
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

Your job is to respond ONLY in the following JSON format — no extra text, no markdown, no explanation outside the JSON:
{
  "crisisType": "detected crisis type",
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

Generate 4-6 action steps ranked from most to least urgent. Use simple Hindi-friendly English that anyone in India can understand. Always prioritize human safety first.

Emergency Situation: ${analysisText}`;

    try {
        let requestBody = {
            contents: [{
                parts: []
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1024
            }
        };

        if (hasImage) {
            const base64Data = AppState.uploadedImageBase64.split(',')[1];
            const mimeType = AppState.uploadedImageBase64.split(';')[0].replace('data:', '');
            requestBody.contents[0].parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        requestBody.contents[0].parts.push({
            text: prompt
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AppState.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
            throw new Error('Invalid API response format');
        }

        const textResponse = data.candidates[0].content.parts[0].text;

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
        alert('Error getting action plan: ' + error.message);
        console.error(error);
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

    outputSection.style.display = 'block';
    outputSection.scrollIntoView({ behavior: 'smooth' });
}

// ==================== DEMO MODE ====================
function loadDemo() {
    // Load a comprehensive demo scenario that showcases all features locally
    const demoText = "Kitchen fire in a restaurant, heavy smoke filling the building, 15 customers and 5 staff members trapped inside, fire started from cooking oil, emergency exits blocked by flames, people showing signs of smoke inhalation";
    document.getElementById('crisisInput').value = demoText;

    // Also set crisis type to Fire for better demo
    document.getElementById('crisisType').value = "Fire";

    // Display local demo response without calling the AI API
    showDemoResponse();
}

function showDemoResponse() {
    const demoResponse = {
        "crisisType": "Fire Emergency",
        "severityLevel": "CRITICAL",
        "summary": "Kitchen fire in a restaurant with heavy smoke blocking exits, 15 customers and 5 staff members trapped inside. Fire started from cooking oil with emergency exits blocked by flames.",
        "actions": [
            {
                "priority": "CRITICAL",
                "title": "Immediate Evacuation",
                "description": "Evacuate all 20 people through the nearest safe exit. Do not use elevators. Stay low to avoid smoke inhalation. Help elderly and children first.",
                "timeframe": "Do in next 30 seconds"
            },
            {
                "priority": "CRITICAL",
                "title": "Call Emergency Services",
                "description": "Dial 101 (Fire Department) immediately. Provide exact restaurant location, number of people trapped, and current situation.",
                "timeframe": "Do in next 1 minute"
            },
            {
                "priority": "HIGH",
                "title": "Fire Suppression Attempt",
                "description": "If safe and trained, use fire extinguisher on the cooking oil fire. Never fight large fires yourself - evacuate instead.",
                "timeframe": "Do in next 2 minutes"
            },
            {
                "priority": "HIGH",
                "title": "Account for Everyone",
                "description": "Take headcount of all 20 people once outside. Report any missing persons to emergency services immediately.",
                "timeframe": "Do in next 5 minutes"
            },
            {
                "priority": "MEDIUM",
                "title": "Smoke Inhalation Treatment",
                "description": "Move people to fresh air. Monitor for symptoms: coughing, difficulty breathing, confusion. Administer oxygen if available.",
                "timeframe": "Do in next 10 minutes"
            },
            {
                "priority": "LOW",
                "title": "Secure the Area",
                "description": "Prevent re-entry until fire department declares it safe. Document the incident for insurance purposes.",
                "timeframe": "Do after emergency services arrive"
            }
        ],
        "doNotDo": [
            "Do not re-enter the building until declared safe by professionals",
            "Do not use elevators during fire emergency",
            "Do not attempt to fight large fires yourself if you're not trained",
            "Do not ignore evacuation signals or emergency instructions",
            "Do not use water on cooking oil fires (use fire extinguisher instead)"
        ],
        "additionalNote": "This is a demo response. For real emergencies, please set up your Google Gemini API key in settings for AI-powered analysis. Remember: Your safety comes first. Professional firefighters are trained for these situations."
    };

    displayResults(demoResponse);
}

// ==================== API COMMUNICATION ====================
