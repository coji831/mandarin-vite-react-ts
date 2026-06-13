# Authentication Feature

JWT-based authentication with login/register forms.

## Components

- **LoginForm**: Email/password login form
- **RegisterForm**: User registration form with password validation
- **AuthPage**: Combined page with tab switching between login/register

## Context

- **AuthContext**: Manages authentication state
  - `user`: Current user object or null
  - `isAuthenticated`: Boolean flag
  - `login(credentials)`: Login method
  - `register(data)`: Registration method
  - `logout()`: Logout method
  - `refreshTokens()`: Refresh access token

## Usage

```tsx
import { useAuth } from "features/auth";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Use auth state and methods
}
```

## Styling

Forms styled to match app theme:

- Primary color: `#646cff`
- Dark mode backgrounds: `#1a1a1a`, `#232a3a`
- Success: `#4caf50`
- Error: `#f44336`

## References

- [API Client Patterns](../../../../../docs/guides/conventions/api-client.md) — Service layer and auth flow conventions
- [Frontend Conventions](../../../../../docs/guides/conventions/frontend.md) — Coding standards and patterns
- [Backend Auth API Spec](../../../../backend/docs/api/auth.md) — Authentication endpoint specifications
- Info/secondary: `#b3c7ff`

## Routes

- `/auth` - Combined auth page (login/register tabs)
- `/auth/login` - Direct login page
- `/auth/register` - Direct register page

> **API patterns:** See [API Client Patterns](../../../../../docs/guides/conventions/api-client.md) for auth service conventions and token refresh handling.
