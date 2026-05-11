# Retell.AI Web App

A complete, responsive, and beautifully designed web application for integrating Retell.AI Voice Agents.

## Setup Instructions

### 1. Backend Configuration
1. Open `backend/.env`
2. Replace `your_retell_api_key_here` with your actual Retell API key from the dashboard.
3. Replace `your_retell_agent_id_here` with the Agent ID you created in Retell.

### 2. Running the Application

**Backend Server:**
```bash
cd backend
npm run dev # or node index.js
```
*Runs on http://localhost:3001*

**Frontend UI:**
```bash
cd frontend
npm run dev
```
*Runs on http://localhost:5173*

## Features Implemented
- **Premium UI:** Glassmorphism, modern typography, custom ambient background animations, responsive visualizers, and state-based styling.
- **Microphone Management:** Requests permissions gracefully before initiating calls.
- **Real-Time Transcripts:** Differentiates user and agent text using chat bubble styling. Auto-scrolls to new messages.
- **Active Audio Visualizer:** Dynamically reacts to agent and user speaking events via high-performance CSS and interval logic.
- **Status & Duration Tracker:** Beautiful badges for precise connection statuses and an integrated live timer.
- **Complete Error Handling:** Catches API misconfigurations and device permission issues with explicit UI banners.
