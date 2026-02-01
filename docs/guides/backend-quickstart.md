# Backend Quick Start

**Category:** Getting Started  
**Audience:** Developers setting up local backend for API development  
**Last Updated:** January 30, 2026  
**Time to Complete:** 10 minutes

> **Purpose:** Run the Express backend locally for API development, testing, and debugging.

---

## Prerequisites

- **Completed:** [Frontend Quick Start](quickstart.md) (Node.js, npm, git, project cloned)
- **PostgreSQL:** Running instance (local or cloud like Supabase)
- **Optional:** Redis instance (caching falls back gracefully if unavailable)

---

## 🚀 Backend Setup (10 Minutes)

### 1. Configure Environment Variables

Create `.env.local` at project root (if you haven't already):

```bash
# Copy example file
cp .env.example .env.local
```

Edit `.env.local` and add **required variables**:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/mandarin_db"

# Authentication (Required)
JWT_SECRET="your-32-char-secret-here"
JWT_REFRESH_SECRET="your-other-32-char-secret-here"

# Generate secrets:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Redis (Optional - caching disabled if not provided)
REDIS_URL="redis://localhost:6379"

# Google Cloud (Required for TTS/Gemini features)
GOOGLE_PROJECT_ID="your-project-id"
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
```

> **Tip:** Use [Supabase](https://supabase.com) for free PostgreSQL hosting. See [Supabase Setup Guide](supabase-setup-guide.md).

### 2. Initialize Database

```bash
# Run Prisma migrations to create tables
npx prisma migrate dev
```

This creates:

- `users` table (authentication)
- `progress` table (vocabulary progress tracking)

**Verify:** Check your database - tables should exist now.

### 3. Start Backend Server

```bash
# Start backend (runs on port 3001)
npm run start-backend
```

**✅ Backend is running at:** `http://localhost:3001`

### 4. Verify Backend Health

Open `http://localhost:3001/api/health` or run:

```bash
curl http://localhost:3001/api/health
```

You should see:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-30T12:00:00.000Z",
  "cache": {
    "enabled": false,
    "connected": false
  }
}
```

---

## 📝 Backend Commands

```bash
# Development
npm run start-backend       # Start backend server

# Database
npm run db:migrate         # Run migrations
npm run db:generate        # Generate Prisma client
npm run db:studio          # Open Prisma Studio (GUI)
npm run db:reset           # Reset database (WARNING: deletes data)

# Testing
npm run test:backend       # Run backend tests
```

---

## 🔧 Configure Frontend to Use Local Backend

The Vite dev server automatically proxies `/api` requests to `http://localhost:3001`.

**Verify proxy works:**

1. Start frontend: `npm run dev`
2. Start backend: `npm run start-backend`
3. Open frontend: `http://localhost:5173`
4. Check browser console - API requests should go to local backend

**No configuration needed!** The proxy is pre-configured in `apps/frontend/vite.config.ts`.

---

## 🎯 Next Steps

### Backend Development

- **Backend Overview:** [apps/backend/README.md](../../apps/backend/README.md)
- **API Specification:** [apps/backend/docs/api-spec.md](../../apps/backend/docs/api-spec.md)
- **Backend Design:** [apps/backend/docs/design.md](../../apps/backend/docs/design.md)
- **Database Guide:** [apps/backend/DATABASE.md](../../apps/backend/DATABASE.md)

### Deep Dives

- **Backend Setup (Detailed):** [Backend Setup Guide](backend-setup-guide.md)
- **Redis Caching:** [Redis Caching Guide](redis-caching-guide.md)
- **Environment Variables:** [Environment Setup Guide](environment-setup-guide.md)

---

## ❓ Troubleshooting

### Database connection errors

```bash
# Test PostgreSQL connection
psql -h localhost -U your_user -d mandarin_db

# Check DATABASE_URL format
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Common Issues:**

- Wrong credentials in DATABASE_URL
- PostgreSQL not running
- Firewall blocking port 5432

### "Missing environment variable" errors

Verify `.env.local` exists at **project root** (not in `apps/backend/`) and contains all required variables.

### Port 3001 already in use

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or change port in apps/backend/src/config/environment.js
PORT=3002
```

### Prisma errors

```bash
# Regenerate Prisma client
npm run db:generate

# Reset migrations (WARNING: deletes data)
npm run db:reset
```

### More Issues?

See [Backend Setup Guide](backend-setup-guide.md) for comprehensive troubleshooting.

---

**Backend is ready! 🎉 Start building APIs.**
