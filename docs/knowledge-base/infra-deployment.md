# Deployment & Infrastructure

**Category:** Infrastructure  
**Last Updated:** December 9, 2025

---

## Vercel Deployment

**When Adopted:** Epic 1 (Google Cloud TTS Integration)  
**Why:** Zero-config deployment, serverless functions, global CDN  
**Use Case:** Deploy React app + API endpoints without managing servers

### Minimal Example

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" }
      ]
    }
  ]
}
```

```typescript
// api/get-tts-audio.ts (Serverless function)
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Serverless function auto-deployed to /api/get-tts-audio
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({ error: "Missing text" });
  }

  const audio = await generateTTS(text as string);

  res.setHeader("Content-Type", "audio/mpeg");
  res.send(audio);
}
```

### Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add GOOGLE_API_KEY
vercel env add DATABASE_URL
```

### Key Lessons

- Serverless functions have 10s timeout (use background jobs for long tasks)
- Environment variables set via Vercel dashboard or CLI
- Use `rewrites` for clean API URLs (`/api/tts` not `/api/get-tts-audio`)
- Enable CORS headers for cross-origin requests
- Vercel auto-detects Vite (no config needed usually)

### When to Use

React apps, serverless APIs, static sites, low-maintenance deployments

---

## Environment Variables

**When Adopted:** Epic 1 (Google Cloud TTS Integration)  
**Why:** Secure secrets, different configs per environment  
**Use Case:** API keys, database URLs, feature flags

### Minimal Example

```bash
# .env.local (Never commit this!)
VITE_API_URL=http://localhost:3000
GOOGLE_API_KEY=AIza...
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret123
```

```typescript
// vite.config.ts (Expose to frontend safely)
export default defineConfig({
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL),
  },
});

// Frontend usage (only VITE_* vars exposed)
const apiUrl = import.meta.env.VITE_API_URL;

// Backend usage (all vars available)
const apiKey = process.env.GOOGLE_API_KEY;
```

### Best Practices

```typescript
// Type-safe environment variables
interface Env {
  GOOGLE_API_KEY: string;
  DATABASE_URL: string;
  REDIS_URL?: string; // Optional
}

function loadEnv(): Env {
  const required = ["GOOGLE_API_KEY", "DATABASE_URL"];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  return {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_URL: process.env.REDIS_URL,
  };
}

const env = loadEnv(); // Fails fast if missing
```

### .gitignore

```
# Environment files (NEVER COMMIT!)
.env
.env.local
.env.production

# Example file for documentation
.env.example  # Commit this with dummy values
```

```.env.example
# Copy to .env.local and fill in real values
GOOGLE_API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
```

### Key Lessons

- Prefix frontend vars with `VITE_` (Vite convention)
- Never commit `.env` files (use `.env.example` for docs)
- Validate required vars on startup (fail fast)
- Use different values per environment (dev, staging, prod)
- Rotate secrets regularly (especially after leaks)

### When to Use

All projects with secrets, multi-environment deployments

---

**Related Guides:**

- [Google Cloud Services](./integration-google-cloud.md) — API keys to secure
- [Backend Authentication](./backend-authentication.md) — JWT secrets
- [Caching Strategies](./integration-caching.md) — Redis connection URLs
