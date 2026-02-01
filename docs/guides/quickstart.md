# Quick Start Guide

**Category:** Getting Started  
**Audience:** New developers getting started  
**Last Updated:** January 30, 2026  
**Time to Complete:** 5 minutes

> **Purpose:** Get the frontend running in 5 minutes. For backend setup, see [Backend Quick Start](backend-quickstart.md).

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

## 📝 Basic Commands

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

## 🎯 Next Steps

### Need Backend Development?
- **Run Local Backend:** See [Backend Quick Start](backend-quickstart.md) for 10-minute backend setup

### Learn the Codebase
- **Project Overview:** [README.md](../../README.md)
- **System Architecture:** [docs/architecture.md](../architecture.md)
- **Frontend Architecture:** [apps/frontend/README.md](../../apps/frontend/README.md)

### Explore Topics
- **Vite Configuration:** [Vite Configuration Guide](vite-configuration-guide.md)
- **Testing:** [Testing Guide](testing-guide.md)
- **Code Conventions:** [Code Conventions](code-conventions.md)
- **Git Workflow:** [Git Conventions](git-convention.md)

---

## ❓ Troubleshooting

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

See [Troubleshooting Guide](troubleshooting.md) for comprehensive solutions.

---

**You're all set! 🎉 Start exploring the codebase.**
