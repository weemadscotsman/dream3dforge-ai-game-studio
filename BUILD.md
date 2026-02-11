# Dream3DForge Build Guide

## Quick Start (Web)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Build for Production (Web)

```bash
npm run build
```

Output in `dist/` — deploy anywhere (Netlify, Vercel, etc.)

---

## Build Android APK (Capacitor)

### Prerequisites
- Node.js 18+
- Android Studio
- Java 17+ (JDK)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Build web app
npm run build

# 3. Initialize Capacitor (first time only)
npx cap init Dream3DForge com.dream3dforge.app --web-dir dist

# 4. Add Android platform (first time only)
npx cap add android

# 5. Copy web assets to Android
npx cap copy android

# 6. Open in Android Studio
npx cap open android
```

In Android Studio:
- Build > Build Bundle(s) / APK(s) > Build APK(s)
- APK will be in `android/app/build/outputs/apk/debug/`

### For Release APK
1. Generate signing key (once):
```bash
keytool -genkey -v -keystore dream3dforge.keystore -alias dream3dforge -keyalg RSA -keysize 2048 -validity 10000
```

2. In Android Studio: Build > Generate Signed Bundle / APK

---

## Build Windows EXE (Electron)

### Prerequisites
- Node.js 18+
- Windows (or Wine on Linux/Mac for cross-compile)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Install Electron dependencies
npm install electron electron-builder --save-dev

# 3. Build web app
npm run build

# 4. Build Windows installer
npm run electron:build
```

Output in `release/` folder:
- `Dream3DForge-{version}-win-x64.exe` (installer)
- `Dream3DForge-{version}-win-x64-portable.exe` (portable)

### Development Mode
```bash
npm run electron:dev
```

---

## Build macOS App (Electron)

```bash
npm run build
npm run electron:build -- --mac
```

Output: `Dream3DForge-{version}-mac-{arch}.dmg`

---

## Build Linux (Electron)

```bash
npm run build
npm run electron:build -- --linux
```

Output: 
- `Dream3DForge-{version}-linux-x64.AppImage`
- `Dream3DForge-{version}-linux-x64.deb`

---

## Project Structure

```
dream3dforge/
├── App.tsx                 # Main React app
├── index.html              # HTML entry
├── index.tsx               # React entry
├── types.ts                # TypeScript types
├── version.ts              # Version info
│
├── components/             # UI components
│   ├── TemplateSelector    # Quick-start templates
│   ├── DifficultySlider    # Difficulty control
│   ├── VisualPresetPicker  # Visual themes
│   ├── SoundControl        # Audio settings
│   └── ...
│
├── services/
│   ├── generators/         # AI generation
│   ├── templates/          # Game templates, touch controls
│   ├── promptRegistry.ts   # AI prompts (doctrine enforced)
│   └── storageService.ts   # IndexedDB persistence
│
├── public/                 # Static assets
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/              # App icons
│
├── electron/               # Electron (desktop)
│   └── main.js             # Main process
│
├── capacitor.config.ts     # Capacitor (mobile)
├── electron-builder.json   # Electron builder config
└── BUILD.md                # This file
```

---

## Environment Variables

Create `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

Get a key from: https://makersuite.google.com/app/apikey

---

## Troubleshooting

### Android: "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=/path/to/Android/Sdk
```

### Electron: White screen
Check console for errors. Usually missing `dist/` folder — run `npm run build` first.

### Touch controls not showing
Touch controls only appear on touch devices. Test with Chrome DevTools device emulation.

---

## Version

v2.4.0 "MOBILE"

Features:
- ✅ PWA (installable from browser)
- ✅ Android (Capacitor)
- ✅ Windows/Mac/Linux (Electron)
- ✅ Mobile touch controls
- ✅ 9 quick-start templates
- ✅ 8 visual presets
- ✅ Difficulty system
- ✅ Auto-save
- ✅ Doctrine enforcement
