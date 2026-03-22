# VibeTalk Frontend

Beautiful, secure, and privacy-focused AI chat application built with React Native and Expo.

## Overview

VibeTalk offers a premium chat experience with AI-powered personas. It features real-time messaging, end-to-end encryption aesthetics, and a smooth, native-feeling UI.

## Features

- 🎨 **Premium UI**: Custom design system with dark mode support.
- 💬 **Real-time Chat**: Socket.IO integration for instant messaging.
- 🤖 **AI Personas**: Chat with unique AI personalities.
- 🔒 **Secure**: Privacy-first approach with local preferences.
- 📱 **Cross-Platform**: Optimized for both Android and iOS.

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: Custom theme system + React Native StyleSheet
- **State Management**: Zustand
- **Navigation**: React Navigation (Native Stack)
- **Networking**: Axios + Socket.IO Client
- **Icons**: Lucide React Native

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo Go app on your physical device OR Android Studio/Xcode for emulators.

### Installation

1.  **Clone the repository** (if you haven't already).
2.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```

### Running the App

1.  **Start the development server**:
    ```bash
    npm start
    ```
2.  **Run on Android**:
    -   Press `a` in the terminal to open in Android Emulator (or connected device).
    -   Or run `npm run android` directly.
3.  **Run on iOS**:
    -   Press `i` in the terminal to open in iOS Simulator.
    -   Or run `npm run ios` directly.

### Environment Variables

Ensure your backend is running locally. You may need to update the API URL in `src/configs/index.ts` if testing on a physical device (use your machine's local IP instead of `localhost`).

## Documentation

For detailed architecture and component documentation, see [doc/overview.md](doc/overview.md).

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── configs/         # App configuration & constants
│   ├── context/         # React Contexts (Auth, Theme)
│   ├── navigation/      # Navigation setup
│   ├── screens/         # App screens
│   ├── services/        # API and Socket services
│   └── theme/           # Design system tokens
├── assets/              # Images and fonts
├── App.tsx              # Entry point
└── package.json
```
