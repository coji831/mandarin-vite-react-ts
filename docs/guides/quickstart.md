# Quick Start Guide

**Category:** Getting Started  
**Last Updated:** December 9, 2025  
**Time to Complete:** 5 minutes

> **Purpose:** Get the project running on your machine in 5 minutes.

---

## Prerequisites

- **Node.js:** v18+ (check: `node --version`)
- **npm:** v9+ (check: `npm --version`)
- **Git:** v2.30+ (check: `git --version`)

---

## 🚀 5-Minute Setup

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/coji831/mandarin-vite-react-ts.git
cd mandarin-vite-react-ts

# Install dependencies (takes 1-2 minutes)
npm install
```

### 2. Run Development Server

```bash
# Start frontend
npm run dev
```

**✅ App is now running at:** `http://localhost:5173`

Open your browser and you should see the Mandarin learning app!

---

## 🔧 Optional: Run Local Backend

If you need API features (TTS audio, conversation generation):

```bash
# In a new terminal window
npm run start-backend
```

**Backend runs at:** `http://localhost:3001`

---

## 📝 Basic Commands

```bash
# Development
npm run dev              # Start frontend (localhost:5173)
npm run start-backend    # Start backend (localhost:3001)

# Testing & Quality
npm test                 # Run all tests
npm run lint            # Check code quality

# Production
npm run build           # Build for production
npm run preview         # Preview production build
```

---

## 🔍 Project Structure Overview

```
mandarin-vite-react-ts/
├── src/                    # Frontend source code
│   ├── main.tsx           # App entry point
│   ├── App.tsx            # Root component
│   └── features/          # Feature modules
│       └── mandarin/      # Mandarin learning feature
├── public/                # Static assets
│   └── data/              # CSV vocabulary files
├── local-backend/         # Express backend server
├── api/                   # Serverless functions (Vercel)
└── docs/                  # Documentation
    ├── knowledge-base/    # Quick reference guides
    └── business-requirements/  # Epic documentation
```

---

## 🎯 Next Steps

### For New Developers

1. **Read the README:** `README.md` - Project overview
2. **Browse Knowledge Base:** `docs/knowledge-base/README.md` - Quick reference guides
3. **Check Architecture:** `docs/architecture.md` - System design

### Learn Specific Topics

- **Vite Configuration:** [Vite Setup Guide](./vite-setup.md)
- **Testing:** [Testing Guide](./testing-setup.md)
- **Code Quality:** [Linting & Formatting](./linting-setup.md)
- **Git Workflow:** [Git Conventions](./git-workflow.md)

---

## ❓ Troubleshooting

### Port already in use

```bash
# Kill process on port 5173 (frontend)
npx kill-port 5173

# Kill process on port 3001 (backend)
npx kill-port 3001
```

### "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### More Issues?

See [Troubleshooting Guide](./troubleshooting.md) or ask in team chat.

---

**You're all set! 🎉 Happy coding!**
