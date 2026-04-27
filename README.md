# 🚨 CrisisIQ — AI Crisis Decision Engine

> **A real-time, AI-powered emergency response assistant that guides you through any crisis — fast, calm, and smart.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Firebase%20Hosted-orange?style=for-the-badge&logo=firebase)](https://emergency-ai-14aa1.web.app)
[![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%20AI-blue?style=for-the-badge&logo=google)](https://aistudio.google.com/)
[![Built For](https://img.shields.io/badge/Built%20For-Hackathon%202026-red?style=for-the-badge)](https://github.com/)

---

## 🧠 What is CrisisIQ?

CrisisIQ is a **mobile-first, AI-powered emergency response web app** that helps users handle crises intelligently in real time. Whether it's a medical emergency, fire, accident, or mental health crisis — CrisisIQ analyzes the situation using **Google Gemini AI**, generates a prioritized action plan, locates nearby emergency services, and even activates an SOS mode with media capture.

Built for high-stress scenarios where every second counts.

---

## 🌐 Live Demo

🔗 **[Try CrisisIQ Live →](https://emergency-ai-14aa1.web.app)**

> Hosted on **Firebase Hosting** — no installation needed, works on any device.

---

## ✨ Key Features

### 🤖 AI-Powered Crisis Analysis
- Powered by **Google Gemini 1.5 Pro** (multimodal AI)
- Analyzes text descriptions, uploaded photos, and voice input together
- Generates **priority-ranked, step-by-step action plans** with urgency levels (CRITICAL / HIGH / MEDIUM / LOW)
- Responds in the **user's language** (multilingual support)
- Includes a **"DO NOT DO"** safety section to prevent common mistakes

### 🎙️ Smart Emergency Trigger System
- **Multi-tap gesture** (5 rapid taps anywhere on screen) activates SOS mode
- **Voice activation** — say *"Emergency"* or *"Help"* to trigger SOS hands-free
- **Haptic feedback** (vibration) on mobile devices for tactile confirmation
- **Toast notification system** with real-time status updates
- Accidental trigger prevention — smart filtering ignores button/link interactions

### 📸 Emergency Media Capture (SOS Mode)
- **Automatic audio + video recording** activates on SOS trigger
- Live camera feed with **front/rear camera toggle**
- Captured media saved locally for evidence
- Visual recording indicator with timer

### 📍 Location & Nearby Services
- **GPS geolocation** with permission handling
- Finds nearest emergency services via **Overpass API (OpenStreetMap)**:
  - 🏥 Hospitals & Clinics
  - 🚓 Police Stations
  - 🚒 Fire Stations
  - 🚑 Ambulance Services
- Shows **distance in km** using Haversine formula
- Interactive **Leaflet.js map** with service markers

### 🗣️ Voice Input
- **Web Speech API** integration with explicit microphone permission handling
- Real-time voice-to-text transcription
- Works across Chrome, Edge, and mobile browsers

### 📷 Photo Upload & Analysis
- Drag-and-drop or click-to-upload accident/scene photos
- AI analyzes images for situational context (Gemini Vision)
- Instant preview with remove option

### 📞 Emergency Contacts (India)
| Service | Number |
|---|---|
| National Emergency | **112** |
| Ambulance | **108** |
| Fire Brigade | **101** |
| Police | **100** |
| iCall (Mental Health) | **9152987821** |

### 🎨 Premium Glassmorphism UI
- Dark-mode, glassmorphism-inspired design
- Fully **responsive — mobile-first layout**
- Smooth micro-animations and transitions
- Panic-friendly interface — large touch targets, high contrast
- Status modals with scroll-safe overlays

---

## 🗂️ Project Structure

```
Crisis/
├── index.html              # Main app — semantic HTML, all sections
├── css/
│   └── styles.css          # Glassmorphism dark theme, responsive design
├── js/
│   ├── app.js              # Core AI logic, location, voice, image analysis
│   └── emergency.js        # Smart Trigger System (SOS, multi-tap, voice activation)
├── modal-styles.css        # Status modal & toast notification styles
├── 404.html                # Custom Firebase Hosting 404 page
├── firebase.json           # Firebase Hosting configuration
├── .firebaserc             # Firebase project binding
└── README.md               # This file
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **AI Engine** | Google Gemini 1.5 Pro (text + vision) |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| **Map & Location** | Leaflet.js + Overpass API (OpenStreetMap) |
| **Voice** | Web Speech API |
| **Media Capture** | MediaDevices API + MediaRecorder API |
| **Hosting** | Firebase Hosting |
| **Browser APIs** | Geolocation, FileReader, Vibration API |

---

## 🚀 Setup & Run Locally

### 1. Get a Google Gemini API Key
- Visit [Google AI Studio](https://aistudio.google.com/)
- Create a free API key (no credit card required)

### 2. Open the App
```bash
# Option A — Direct (no build step needed)
Open index.html in Chrome or Edge

# Option B — Firebase CLI
npm install -g firebase-tools
firebase serve
```

### 3. Configure the API Key
1. Open the app in your browser
2. Click ⚙️ **API Settings** (top right)
3. Paste your **Gemini API Key**
4. Click **Save Key**

### 4. Try It Out
| Action | How |
|---|---|
| Describe emergency | Type in the text box |
| Use voice input | Click 🎤 and speak |
| Upload scene photo | Drag-drop or click the upload area |
| Get nearby help | Click 📍 **Find Nearby Services** |
| Trigger SOS | Tap screen **3 times rapidly** or say *"Emergency"* |
| See a demo | Click the **Load Demo** button |

---

## 🔌 APIs Used

| API | Purpose | Key Required |
|---|---|---|
| Google Gemini 1.5 Pro | AI text + image analysis | ✅ Yes (free tier available) |
| Overpass API | Find nearby emergency facilities | ❌ No |
| Web Geolocation API | Get user's GPS coordinates | ❌ No (browser built-in) |
| Web Speech API | Voice input & activation | ❌ No (browser built-in) |
| MediaDevices / MediaRecorder | Camera & audio recording | ❌ No (browser built-in) |

---

## 🌍 Browser Compatibility

| Browser | Text/AI | Voice | Camera/SOS |
|---|---|---|---|
| Chrome (Desktop/Mobile) | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Firefox | ✅ | ⚠️ Partial | ✅ |
| Safari (iOS 15+) | ✅ | ⚠️ Partial | ✅ |

> Voice activation and multi-tap SOS work best on **Chrome for Android**.

---

## 📱 Mobile-First Design Decisions

- All touch targets are **≥ 44px** (WCAG compliant)
- Status popups are **height-constrained with overflow scroll** — never cover the full screen
- SOS trigger ignores taps on interactive elements to prevent accidental activation
- Haptic feedback via **Vibration API** on supported devices
- Camera feed optimized for **portrait mode** on mobile

---

## 🔮 Future Roadmap

### 🎯 Main Focus — Upcoming Core Enhancements

- [ ] 🤕 **Sensor-Based Injury Auto-Detection** — Integrate device sensors (accelerometer, gyroscope, heart-rate via wearables) to automatically detect if a user is injured (e.g., sudden fall, abnormal vitals) and instantly trigger emergency services — **no manual action required**, as long as the app is installed on the device
- [ ] 📡 **Automatic Evidence Collection via Sensors** — Upon injury or emergency detection, the app will autonomously activate the camera, microphone, and location sensors to collect and preserve evidence in real time, without the user needing to interact with the device
- [ ] 📱 **Physical Button SOS Trigger** — Triple-press the device's **volume or power button** (3 times) to activate the emergency trigger instantly — designed for situations where the screen cannot be accessed

### 🛠️ Additional Planned Improvements

- [ ] Offline support via **Service Worker + cached Gemini responses**
- [ ] **PDF export** of the action plan
- [ ] Real-time location sharing with trusted contacts
- [ ] **Multi-language UI** (Hindi, Tamil, Bengali)
- [ ] Integration with official emergency dispatch APIs
- [ ] Offline AI fallback using **on-device models**
- [ ] Push notifications for incident updates

---

## 🏆 Hackathon Context

Built for the **2026 Crisis Response Hackathon**.

**Problem Statement:** In emergencies, people often panic, don't know what to do, and can't quickly find help.

**Our Solution:** CrisisIQ eliminates decision paralysis by instantly analyzing the situation with AI and delivering a clear, actionable response plan — all from a single tap on any device, no app install required.

---

## 📄 License

MIT License — Open source, built for public good.

---

## 📬 Support & Docs

- Gemini API Docs: [ai.google.dev/docs](https://ai.google.dev/docs)
- Firebase Hosting Docs: [firebase.google.com/docs/hosting](https://firebase.google.com/docs/hosting)
- Overpass API: [overpass-api.de](https://overpass-api.de/)

---

**Version:** 2.0 &nbsp;|&nbsp; **Last Updated:** April 2026 &nbsp;|&nbsp; **Status:** ✅ Production Ready
