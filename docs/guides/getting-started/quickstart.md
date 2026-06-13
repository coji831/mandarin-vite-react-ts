# Quick Start Guide

**Last Updated:** June 3, 2026  
**Purpose:** Get the frontend running in 5 minutes  
**Audience:** New developers getting started  
**Time to Complete:** 5 minutes

> **When to read this:** When you need to get the frontend running quickly for the first time.
> **Note:** Get the frontend running in 5 minutes. For backend setup, see [Backend Development Guide](../setup/backend-development.md).

---

## Prerequisites

- **Node.js:** v18+ (check: `node --version`)
- **npm:** v9+ (check: `npm --version`)
- **Git:** v2.30+ (check: `git --version`)

---

## 🚀 Frontend Setup (5 Minutes)

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/coji831/mandarin-vite-react-ts.git
cd mandarin-vite-react-ts

# Install dependencies (takes 1-2 minutes)
npm install
```

### 2. Start Development Server

```bash
# Start frontend
npm run dev
```

**✅ App is now running at:** `http://localhost:5173`

Open your browser and you should see the Mandarin learning app!

> **Note:** The frontend uses a Vite proxy to connect to the production backend by default. API features (vocabulary, flashcards, audio) work out of the box without backend setup.

---

## Basic Commands

```bash
# Development
npm run dev              # Start frontend (localhost:5173)

# Testing
npm test                 # Run all tests

# Production
npm run build           # Build for production
npm run preview         # Preview production build
```

---

## Next Steps

### Need Backend Development?

- **Run Local Backend:** See [Backend Development Guide](../setup/backend-development.md) for 10-minute backend setup

### Learn the Codebase

- **System Architecture:** [docs/architecture.md](../../architecture.md)
- **Frontend Architecture:** [apps/frontend/README.md](../../../apps/frontend/README.md)

### Explore Topics

- **Vite Configuration:** [Vite Setup Guide](../setup/vite.md)
- **Testing:** [Frontend Testing Guide](../testing/frontend.md) | [Backend Testing Guide](../testing/backend.md)
- **Frontend Conventions:** [Frontend Conventions](../conventions/frontend.md)
- **Git Workflow:** [Git Conventions](../conventions/git.md)

---

## Troubleshooting

### Port 5173 already in use

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Module not found errors

```bash
npm install
```

### Changes not appearing

Press `Ctrl+Shift+R` (hard refresh) in browser

### More Issues?

See [Troubleshooting Guide](../operations/troubleshooting.md) for comprehensive solutions.

---

**You're all set! Start exploring the codebase.**
