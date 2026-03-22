# Frontend Architecture Overview

This document provides a technical overview of the VibeTalk frontend application.

## Architecture Pattern

The application follows a **Service-Oriented Architecture** combined with **Component-Based UI**.

### 1. Services Layer (`src/services`)
Handles all external communication and business logic that exists outside the UI.
-   **`api.ts`**: Axios instance for REST API calls (Auth, User Management).
-   **`socket.ts`**: Singleton `SocketService` class managing the Socket.IO connection. Handles events, reconnection logic, and emits messages.
-   **`chat.service.ts`**: Encapsulates chat-specific API calls (fetching history, starting sessions).

### 2. State Management
We use a hybrid approach:
-   **Global App State**: Usage of `Zustand` (planned) or `React Context` for Auth (`AuthContext`) and Theme (`ThemeContext`).
-   **Local UI State**: `useState` and `useReducer` for screen-specific data (e.g., chat history in `ChatScreen`, form inputs).

### 3. Navigation (`src/navigation`)
Uses **React Navigation** with a Native Stack Navigator.
-   **`AppNavigator`**: The main navigator handling authentication flow (Login vs. Home).
-   **Routes**: Defined in `src/navigation/routes.ts` (if extracted) or directly in the navigator.

## Key Modules

### Chat System (`src/screens/ChatScreen.tsx`)
The core feature of the app.
-   **Optimistic UI**: Messages are added to the local list immediately with a `'sending'` status.
-   **Socket Integration**: Listens for `message-sent` (delivery confirmation) and `persona-response` (AI reply).
-   **Delivery Tracking**: Uses a unique `clientMsgId` to match temporary messages with server-confirmed messages.

### Authentication
-   **`AuthContext`**: Manages the user session. Persists tokens using `AsyncStorage`.
-   **`LoginScreen`**: Handles Google/Facebook OAuth and Guest login.

## Design System (`src/theme`)

The app features a custom design system allowing for easy theming (Dark/Light mode).
-   **`colors.ts`**: Defines the color palette (Primary, Background, Accent).
-   **`typography.ts`**: Font definitions (Plus Jakarta Sans).
-   **`useTheme`**: Hook to access current theme values.

## File Structure

-   `components/`: generic UI elements (Buttons, Inputs, Loaders).
-   `screens/`: Full-page views.
-   `configs/`: Environment variables and app constants.
