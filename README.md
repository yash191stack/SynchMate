# 🧠 RoommateIQ: Privacy-First College Roommate Matching Platform

RoommateIQ is a high-performance, privacy-focused roommate matching platform built specifically for university students. It eliminates random WhatsApp/Facebook search dependencies by utilizing multi-dimensional preference vector matching, hard-lock lifestyle dealbreaker gates, and double-blind opt-in swiping.

---

## 🛠️ System Architecture & Tech Stack

### Core Technologies
- **Frontend:** React (Vite-scaffolded), Tailwind CSS, Framer Motion (physical swipe physics)
- **Backend:** Node.js + Express.js (ESM modules)
- **Database:** MongoDB (using Mongoose models with geospatial indexing)
- **Caching Layer:** Redis (storing swipe histories to optimize DB read efficiency)
- **Communication:** WebSockets (Socket.io) for real-time encrypted messaging and double-blind match triggers

```
               [ React Client ]
                  /        \
          (REST) /          \ (WebSockets)
                v            v
     [ Express Server ] <-> [ Socket.io Gateway ]
        /          \
  (Mongoose)    (Redis Client)
      /              \
[ MongoDB ]      [ Redis Cache ]
```

---

## 🧠 Core Engineering Features

### 1. Vector Matching Engine (Cosine Similarity)
Rather than executing basic filter blocks, roommate habits are mapped into numerical vectors:
$$V = [\text{Sleep Schedule}, \text{Cleanliness}, \text{Socialness}, \text{Diet}]$$
where values are scaled from $0.1$ to $0.9$. 

The system runs a **Cosine Similarity** calculation to compute the exact multi-dimensional angle between two user preference profiles.
$$\text{Compatibility Score} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$

### 2. Hard-Lock Dealbreaker Middleware
A strict lifestyle gating layer intercepts calculations. If critical preferences like **Budget Range** or **Smoking Preferences** do not overlap, the compatibility score is instantly forced to $0\%$ bypassing vector calculation and DB indexing overheads.

### 3. Double-Blind Opt-In Swiping
User profiles are loaded as swipeable cards. WebSocket communication links are locked and encrypted until *both* users swipe right on each other, maintaining strict privacy control.

### 4. `.edu` Institutional Domain Gateway
Signups are restricted using institutional email validators to ensure only verified student domains can register.

---

## 🚀 Execution & Setup

### Requirements
- Node.js (v18+)
- MongoDB (running locally or Atlas cluster)
- Redis Server (optional, runs with local in-memory fallback cache if offline)

### 1. Setup Backend Server
```bash
cd server
npm install
# Copy environment template
cp .env.example .env
# Start server in development mode
npm run dev
```

### 2. Setup Client Dashboard
```bash
cd client
npm install
# Start Vite development server
npm run dev
```
