# Authentication Context Rules

**Auto-activated when working in**:
- `apps/frontend/src/features/auth/`
- `apps/backend/src/api/controllers/authController.js`
- `apps/backend/src/core/services/AuthService.js`

---

## JWT Authentication Pattern

### Token Types
1. **Access Token** (15 minutes, httpOnly cookie)
   - Used for API authentication
   - Short-lived for security
   - Contains: `{ userId, email }`

2. **Refresh Token** (7 days, httpOnly cookie)
   - Used to refresh access tokens
   - Long-lived for UX
   - Contains: `{ userId }`

### Token Flow
```
User Login
   ↓
Generate access + refresh tokens
   ↓
Set both as httpOnly cookies
   ↓
Frontend requests with cookies
   ↓
Access token expires (401)
   ↓
Auto-refresh via /api/auth/refresh
   ↓
Retry original request
```

---

## Backend Implementation

### AuthService (Business Logic)
```javascript
// apps/backend/src/core/services/AuthService.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register(email, password, displayName) {
    // Validate email uniqueness
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password (salt rounds: 10)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.userRepository.create({
      email: email.toLowerCase(),
      passwordHash,
      displayName,
    });

    return this.generateTokens(user);
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email.toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken, user };
  }

  async refreshAccessToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await this.userRepository.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return accessToken;
  }
}
```

### AuthController (API Layer)
```javascript
// apps/backend/src/api/controllers/authController.js
import { AuthService } from '../../core/services/AuthService.js';
import { UserRepository } from '../../infrastructure/repositories/UserRepository.js';

export class AuthController {
  constructor() {
    const userRepository = new UserRepository();
    this.authService = new AuthService(userRepository);
  }

  async register(req, res) {
    try {
      const { email, password, displayName } = req.body;

      const { accessToken, refreshToken, user } = await this.authService.register(
        email,
        password,
        displayName
      );

      this.setAuthCookies(res, accessToken, refreshToken);

      res.status(201).json({
        user: { id: user.id, email: user.email, displayName: user.displayName },
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const { accessToken, refreshToken, user } = await this.authService.login(
        email,
        password
      );

      this.setAuthCookies(res, accessToken, refreshToken);

      res.status(200).json({
        user: { id: user.id, email: user.email, displayName: user.displayName },
      });
    } catch (error) {
      // Log failed attempt
      console.warn('Failed login attempt:', {
        email: email?.toLowerCase(),
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });

      res.status(401).json({ error: 'Invalid credentials' });
    }
  }

  async refresh(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const accessToken = await this.authService.refreshAccessToken(refreshToken);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.status(200).json({ message: 'Token refreshed' });
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  async logout(req, res) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out' });
  }

  async me(req, res) {
    try {
      const userId = req.user.id; // Set by authenticate middleware
      const user = await this.authService.getUserById(userId);

      res.status(200).json({
        user: { id: user.id, email: user.email, displayName: user.displayName },
      });
    } catch (error) {
      res.status(404).json({ error: 'User not found' });
    }
  }

  setAuthCookies(res, accessToken, refreshToken) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
```

### Authentication Middleware
```javascript
// apps/backend/src/api/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

---

## Frontend Implementation

### authFetch Wrapper (Auto-Refresh)
```typescript
// apps/frontend/src/utils/authFetch.ts
export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  let response = await fetch(url, {
    ...options,
    credentials: 'include', // Include httpOnly cookies
  });

  // Auto-refresh on 401
  if (response.status === 401) {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      // Retry original request
      response = await fetch(url, {
        ...options,
        credentials: 'include',
      });
    }
  }

  return response;
}
```

### useAuth Hook
```typescript
// apps/frontend/src/features/auth/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/authFetch';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore auth on mount
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const response = await authFetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth restoration failed:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreAuth();
  }, []);

  // Background token refresh (every 10 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Background refresh failed:', error);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return { user, isAuthenticated, loading, login, logout };
}
```

### Protected Route Component
```typescript
// apps/frontend/src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

## Security Best Practices

### Password Security
- ✅ Use bcrypt with salt rounds ≥ 10
- ✅ Never log or expose password hashes
- ✅ Enforce minimum password length (8+ characters)
- ❌ Don't use plain text or MD5/SHA1

### Token Security
- ✅ Use httpOnly cookies (prevents XSS)
- ✅ Use secure flag in production (HTTPS only)
- ✅ Use sameSite: 'lax' (prevents CSRF)
- ✅ Short expiry for access tokens (15 min)
- ❌ Don't store tokens in localStorage (XSS vulnerable)

### Failed Login Logging
```javascript
console.warn('Failed login attempt:', {
  email: email.toLowerCase(),      // Sanitized
  ip: req.ip,                      // For rate limiting
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString(),
});
```

### Rate Limiting (TODO: Implement)
```javascript
// apps/backend/src/api/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
});

// Apply to login route
app.post('/api/auth/login', loginRateLimiter, authController.login);
```

---

## Testing Patterns

### Backend Auth Tests
```javascript
describe('AuthService', () => {
  test('login generates valid tokens', async () => {
    const { accessToken, refreshToken } = await authService.login(email, password);

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(user.id);
  });

  test('login fails with invalid credentials', async () => {
    await expect(
      authService.login(email, 'wrongpassword')
    ).rejects.toThrow('Invalid credentials');
  });
});
```

### Frontend Auth Tests
```typescript
describe('useAuth', () => {
  test('restores auth on mount', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });
});
```

---

## Common Pitfalls

### ❌ Don't
```typescript
// Storing tokens in localStorage
localStorage.setItem('accessToken', token); // XSS vulnerable

// Missing credentials in fetch
fetch('/api/protected', { method: 'GET' }); // Cookies not sent

// Not handling 401 refresh
if (response.status === 401) {
  navigate('/login'); // Should try refresh first
}
```

### ✅ Do
```typescript
// Use httpOnly cookies (set by server)
res.cookie('accessToken', token, { httpOnly: true });

// Always include credentials
fetch(url, { credentials: 'include' });

// Auto-refresh with authFetch
const response = await authFetch('/api/protected'); // Handles 401 automatically
```

---

## Related Documentation

- Authentication patterns: @docs/knowledge-base/backend-authentication.md
- Backend setup: @docs/guides/backend-setup-guide.md
- Story 13.3 BR: @docs/business-requirements/epic-13-production-backend-architecture/story-13-3-authentication.md
- Story 13.3 Implementation: @docs/issue-implementation/epic-13-production-backend-architecture/story-13-3-authentication.md
