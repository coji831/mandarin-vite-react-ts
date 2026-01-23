# Data Migration & Versioning

**Category:** Frontend Development  
**Last Updated:** December 9, 2025

---

## localStorage Data Migration Pattern

**When Adopted:** Epic 6 (Multi-User Progress Architecture), Epic 7 (Remove Daily Commitment)  
**Why:** Gracefully handle breaking changes in persisted data  
**Use Case:** Evolving data structures, schema changes

### Minimal Example

```typescript
// 1. Version your data
interface Progress {
  version: number; // ALWAYS include version
  data: ProgressData;
  migratedAt?: string;
}

// 2. Migration functions
function migrateV1ToV2(v1: ProgressV1): ProgressV2 {
  return {
    version: 2,
    data: {
      // Transform sections -> progress map
      progress: v1.data.sections.reduce((acc, section) => {
        section.words.forEach((word) => {
          acc[word.wordId] = {
            masteryLevel: word.learned ? 1.0 : 0.0,
            lastReviewed: section.lastReviewed,
          };
        });
        return acc;
      }, {} as Record<string, WordProgress>),
    },
    migratedAt: new Date().toISOString(),
  };
}

function migrateV2ToV3(v2: ProgressV2): ProgressV3 {
  return {
    version: 3,
    data: {
      ...v2.data,
      userId: generateUserId(), // Add new field
    },
    migratedAt: new Date().toISOString(),
  };
}

// 3. Load with migration chain
function loadProgress(): Progress {
  const stored = localStorage.getItem("progress");
  if (!stored) return getDefaultProgress();

  try {
    let data = JSON.parse(stored);

    // Apply migrations sequentially
    if (data.version === 1) {
      console.log("Migrating progress v1 → v2");
      data = migrateV1ToV2(data);
    }
    if (data.version === 2) {
      console.log("Migrating progress v2 → v3");
      data = migrateV2ToV3(data);
    }

    // Save migrated data
    if (data.migratedAt) {
      saveProgress(data);
    }

    return data;
  } catch (error) {
    console.error("Failed to load progress:", error);
    return getDefaultProgress();
  }
}

// 4. Backup before migration
function loadProgressWithBackup(): Progress {
  const stored = localStorage.getItem("progress");
  if (!stored) return getDefaultProgress();

  const data = JSON.parse(stored);

  // Backup old version
  if (data.version < CURRENT_VERSION) {
    const backupKey = `progress-backup-v${data.version}`;
    localStorage.setItem(backupKey, stored);
    console.log(`Backup saved to ${backupKey}`);
  }

  return migrateToLatest(data);
}
```

### Key Lessons

- Always version persisted data (`version: number`)
- Backup before migration (user can rollback)
- Log migrations (helpful for debugging)
- Test migrations with real old data
- Provide reset option if migration fails

### When to Use

Any persisted data that might change structure

---

## User/Device Identification

**When Adopted:** Epic 6 (Multi-User Progress Architecture)  
**Why:** Track progress per user/device  
**Use Case:** Multi-user apps, cross-device sync

### Minimal Example

```typescript
// 1. Generate unique device ID
function generateDeviceId(): string {
  // Check if already exists
  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    // Generate UUID v4
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
}

// 2. User identity hook
function useUserIdentity() {
  const [userId, setUserId] = useState<string | null>(null);
  const [deviceId] = useState(generateDeviceId);

  useEffect(() => {
    // Load logged-in user from auth
    const savedUserId = localStorage.getItem("userId");
    if (savedUserId) {
      setUserId(savedUserId);
    }
  }, []);

  return {
    userId, // null if not logged in
    deviceId, // always present
    identifier: userId || deviceId, // Use userId if available
  };
}

// 3. Usage
function ProgressProvider({ children }) {
  const { identifier } = useUserIdentity();
  const [progress, setProgress] = useState<Progress>({});

  useEffect(() => {
    // Load progress for this user/device
    const key = `progress-${identifier}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setProgress(JSON.parse(stored));
    }
  }, [identifier]);

  const saveProgress = (data: Progress) => {
    const key = `progress-${identifier}`;
    localStorage.setItem(key, JSON.stringify(data));
    setProgress(data);
  };

  return (
    <ProgressContext.Provider value={{ progress, saveProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}
```

### Key Lessons

- Device ID persists across sessions
- User ID takes precedence when logged in
- Use `crypto.randomUUID()` for unique IDs
- Namespace keys: `progress-${userId}`

### When to Use

Multi-user apps, cross-device sync, analytics

---

## Auth State Restoration with /me Endpoint

**When Adopted:** Epic 13 Story 13.3 (JWT Authentication System)  
**Why:** Restore auth state on page refresh without exposing credentials  
**Use Case:** httpOnly cookie-based authentication, session recovery

### Problem: Auth State Lost on Refresh

With httpOnly cookies, JavaScript cannot read the refresh token directly. On page refresh, AuthContext resets to `isAuthenticated: false` until user makes an authenticated request.

**Old Approach (localStorage — Vulnerable to XSS):**

```typescript
// ❌ DON'T: Store tokens in localStorage
const user = JSON.parse(localStorage.getItem("user"));
setUser(user);
```

**New Approach (GET /me Endpoint):**

```typescript
// ✅ DO: Restore from backend session
useEffect(() => {
  authFetch("/auth/me")
    .then((res) => res.json())
    .then((userData) => setUser(userData))
    .catch(() => setUser(null)); // Not logged in
}, []);
```

### Implementation Pattern

**Backend: GET /me Endpoint**

```typescript
// apps/backend/src/routes/auth.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/me", authenticateToken, (req, res) => {
  // authenticateToken middleware attaches user to req
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
  });
});

export default router;
```

**Frontend: AuthContext Restoration Flow**

```typescript
// apps/frontend/src/contexts/AuthContext.tsx
import { createContext, useEffect, useState, useRef } from "react";
import { authFetch } from "../utils/authFetch";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  // Restore session on mount
  useEffect(() => {
    isMounted.current = true;

    const restoreSession = async () => {
      try {
        const response = await authFetch("/auth/me");
        if (!response.ok) throw new Error("Not authenticated");

        const userData = await response.json();
        if (isMounted.current) {
          setUser(userData);
        }
      } catch (error) {
        console.log("No active session");
        if (isMounted.current) {
          setUser(null);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Show loading state while checking session
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Key Implementation Notes:**

1. **isMounted guard:** Prevent React 18 Strict Mode double-mount race conditions
2. **isLoading state:** Show loading UI while checking session (prevents flash of logged-out state)
3. **authFetch wrapper:** Automatically includes `credentials: 'include'` for cookies
4. **Graceful failure:** No session = not logged in (not an error)

### Migration from localStorage User Storage

**Before (Epic 6):**

```typescript
// ❌ Old: localStorage for user identity
const userId = localStorage.getItem("userId");
if (userId) {
  setUser({ id: userId });
}
```

**After (Epic 13):**

```typescript
// ✅ New: Backend /me endpoint
const response = await authFetch("/auth/me");
const userData = await response.json();
setUser(userData);
```

**Migration Steps:**

1. Remove `localStorage.setItem('userId', ...)` from login flow
2. Remove `localStorage.getItem('userId')` from AuthContext
3. Add GET /me endpoint to backend
4. Add session restoration in AuthContext useEffect
5. Update protected routes to check `isLoading` state

### Key Benefits

- **XSS Protection:** No tokens in localStorage/sessionStorage
- **Consistent State:** Backend is source of truth
- **Automatic Expiry:** Session expires when refresh token expires
- **Better UX:** No flash of logged-out state
- **Simpler Logic:** No manual token parsing or validation

### When to Use

- Any httpOnly cookie-based authentication
- Session-based auth (Express sessions, Passport.js)
- SSR apps (Next.js, Remix) with server-side session checks
- Mobile apps with secure token storage (iOS Keychain, Android KeyStore)

---

## Data Structure Refactoring

**When Adopted:** Epic 7 (Remove Daily Commitment), Epic 10 (Unified Data Model)  
**Why:** Simplify data model, improve performance  
**Use Case:** Breaking changes to state shape

### Minimal Example

```typescript
// ❌ Old structure (section-based)
interface OldProgress {
  sections: {
    id: string;
    words: { wordId: string; learned: boolean }[];
  }[];
}

// ✅ New structure (flat progress map)
interface NewProgress {
  progress: Record<string, WordProgress>; // wordId -> progress
}

// Migration
function migrateSectionToFlat(old: OldProgress): NewProgress {
  const progress: Record<string, WordProgress> = {};

  old.sections.forEach((section) => {
    section.words.forEach((word) => {
      progress[word.wordId] = {
        masteryLevel: word.learned ? 1.0 : 0.0,
        lastReviewed: new Date().toISOString(),
      };
    });
  });

  return { progress };
}

// Update all consumers
function FlashCardPage() {
  const { progress } = useProgress();

  // Old: progress.sections[0].words[0].learned
  // New: progress.progress[wordId].masteryLevel >= 0.5

  const word = words[currentIndex];
  const isLearned = progress.progress[word.id]?.masteryLevel >= 0.5;

  return (
    <div>
      {isLearned ? "✓" : "○"} {word.chinese}
    </div>
  );
}
```

### Refactoring Checklist

- [ ] Document old and new structure
- [ ] Write migration function
- [ ] Test migration with real data
- [ ] Update all consumers (grep search)
- [ ] Run tests
- [ ] Deploy with migration
- [ ] Monitor for errors

### When to Use

Breaking changes to state structure, performance optimization

---

**Related Guides:**

- [State Management](./frontend-state-management.md) — Normalized state
- [Backend Database](./backend-database.md) — Server-side migrations
