# CrisisIQ — AI Crisis Decision Engine

A professional, multi-file structured emergency response assistant powered by Google Gemini AI.

## Project Structure

```
Crisis/
├── index.html          # Main HTML file (clean, semantic markup)
├── css/
│   └── styles.css      # All styling (organized by sections)
├── js/
│   └── app.js          # All JavaScript logic (modular, well-commented)
└── README.md           # This file
```

## Features

### 1. **Emergency Input**
- **Text Description** - Describe the crisis in detail
- **Voice Input** - Use microphone to speak (Web Speech API)
- **Photo Upload** - Upload/drag-drop accident photos for AI analysis
- **Crisis Type Selection** - Choose from predefined categories or auto-detect

### 2. **AI Analysis**
- **Gemini AI Integration** - Powers intelligent crisis assessment
- **Image Recognition** - Analyzes uploaded photos for situational awareness
- **Priority-based Actions** - Generates 4-6 actionable steps ranked by urgency

### 3. **Location Services**
- **Geolocation** - Gets user's GPS coordinates (with permission)
- **Nearby Emergency Services** - Finds nearest:
  - Hospitals & Clinics
  - Police Stations
  - Fire Stations
  - Ambulance Services
- **Distance Calculation** - Shows distance to each facility in km

### 4. **Response Plan**
- **Severity Levels** - CRITICAL, HIGH, MEDIUM, LOW (color-coded)
- **Step-by-Step Actions** - Clear instructions with timeframes
- **Safety Warnings** - "DO NOT DO" section with critical mistakes to avoid
- **Additional Information** - Context-specific guidance

### 5. **Emergency Contacts**
- 112 - National Emergency
- 108 - Ambulance
- 101 - Fire Brigade
- 100 - Police
- 9152987821 - iCall (Mental Health Support)

## File Organization

### `index.html` (Clean & Minimal)
- Pure HTML markup
- All inline code removed
- External CSS & JS references
- Semantic structure with comments
- ~95 lines

### `css/styles.css` (Well-Organized)
- Organized into clear sections:
  - Reset & Base Styles
  - Header
  - Settings
  - Input Section
  - Buttons
  - Image Upload
  - Examples
  - Output Section
  - Crisis Summary
  - Actions
  - DO NOT DO
  - Emergency Contacts
  - Location
  - Footer
  - Responsive Design
- ~400 lines

### `js/app.js` (Modular & Maintainable)
- **State Management** - Centralized app state
- **Initialization** - DOMContentLoaded setup
- **Settings Management** - API key storage
- **Image Handling** - Upload, drag-drop, preview
- **Voice Input** - Speech recognition
- **Location Services** - Geolocation & nearby places
- **API Communication** - Gemini integration
- **UI Display** - Result rendering
- **Demo Mode** - Sample crisis response
- ~650 lines with comments

## Setup Instructions

### 1. Get a Google Gemini API Key
- Visit [Google AI Studio](https://aistudio.google.com/)
- Create a free API key
- Keep it secure

### 2. Open the Application
1. Open `index.html` in a modern browser
2. Click ⚙️ **API Settings**
3. Enter your Gemini API Key
4. Click "Save Key"

### 3. Try It Out
- **Text Input**: Describe your emergency
- **Voice Input**: Click 🎤 to speak
- **Photo Upload**: Click/drag photo of accident
- **Location**: Click 📍 to get nearby help
- **Demo Mode**: Click green button to see sample response

## API Usage

- **Gemini API**: Image & text analysis
- **Overpass API**: OpenStreetMap data (free, no key needed)
- **Web APIs**: Geolocation, FileReader, Speech Recognition

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires:
  - JavaScript enabled
  - Geolocation support (optional)
  - Web Speech API (for voice input)

## Code Quality

✅ Clean Separation of Concerns
✅ Well-commented sections
✅ Responsive design
✅ Organized CSS with logical flow
✅ Modular JavaScript functions
✅ Professional styling
✅ Error handling
✅ Accessibility considerations

## Key Functions

### Image Handling
- `handleDragOver()` - Visual feedback on drag
- `handleDrop()` - Process dropped files
- `processImageFile()` - Convert to Base64

### Location
- `getUserLocation()` - Request geolocation
- `findNearbyPlaces()` - Query Overpass API
- `calculateDistance()` - Haversine formula

### API
- `getActionPlan()` - Main AI request
- `displayResults()` - Render response
- `loadDemo()` - Show sample

### UI
- `toggleSettings()` - Toggle settings panel
- `saveApiKey()` - Store API key
- `loadExample()` - Quick scenario loading

## Future Enhancements

- [ ] Offline support (Service Worker)
- [ ] Multiple language support
- [ ] Export action plan as PDF
- [ ] Share location with emergencyservices
- [ ] Real-time incident tracking
- [ ] Integration with emergency dispatch systems
- [ ] Offline AI model fallback
- [ ] Push notifications for updates

## License

Built for Rapid Crisis Thinking Hackathon

## Support

For API issues, visit [Google AI Studio Documentation](https://ai.google.dev/docs)

---

**Last Updated:** April 2026
**Version:** 1.0
