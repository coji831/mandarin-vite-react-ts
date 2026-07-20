# Feature: Auth — Design Spec

**Last Updated:** 2026-07-20
**Status:** Reviewed

---

## Figma Reference

- **File:** (not yet linked — add Figma file URL here)
- **Frame:** Login / Register

---

## Layout

Two standalone pages accessed from header navigation:

| Route            | Page                 | Purpose                |
| ---------------- | -------------------- | ---------------------- |
| `/auth/login`    | `LoginPage`          | User login form        |
| `/auth/register` | `RegisterPage`       | User registration form |
| `/auth`          | (redirects to login) | Auth root              |

Both pages are centered-card layouts with a clean, minimal design.

---

## Components

| Component        | Source                     | Notes                                                  |
| ---------------- | -------------------------- | ------------------------------------------------------ |
| `LoginForm`      | Custom in `components/`    | Email + password fields, submit, link to register      |
| `RegisterForm`   | Custom in `components/`    | Email + password + display name, submit, link to login |
| `ProtectedRoute` | Custom in `components/`    | Route guard — redirects to login if unauthenticated    |
| `Button`         | `shared/components/Button` | Submit button (variant="primary")                      |
| `Input`          | `shared/components/Input`  | Email, password, display name inputs                   |

### States per form

| State       | Handling                                                      |
| ----------- | ------------------------------------------------------------- |
| **Default** | Empty form with email/password fields                         |
| **Loading** | Submit button shows spinner (`loading` prop), fields disabled |
| **Error**   | Inline error message above the form                           |
| **Success** | Redirect to dashboard after login/register                    |

---

## Backend Integration

- API calls via native `fetch()` in `features/auth/context/AuthContext.tsx`
- JWT tokens stored as httpOnly cookies (refresh token) and localStorage (access token)
- Auth state managed by React Context (`AuthContext`)

---

## Design Tokens Used

### Colors

| Token   | CSS Variable       | Usage                     |
| ------- | ------------------ | ------------------------- |
| Primary | `--color-primary`  | Submit button             |
| Error   | `--color-error`    | Validation/error messages |
| —       | `--text-primary`   | Form labels               |
| —       | `--text-secondary` | Helper text, links        |
| —       | `--surface-dark`   | Form card background      |

### Spacing

| Token        | Value | Usage                   |
| ------------ | ----- | ----------------------- |
| `--space-md` | 16px  | Gap between form fields |
| `--space-lg` | 24px  | Card padding            |
| `--space-xl` | 32px  | Page section padding    |

### Component Classes

| Class                    | Usage                  |
| ------------------------ | ---------------------- |
| `.input-base`            | Text input fields      |
| `Box variant="elevated"` | Form container card    |
| `.flex-col-center`       | Centered column layout |
| `.gap-md` / `.gap-lg`    | Flex gaps              |

---

## Visual Acceptance Criteria

- [ ] Centered card layout with max-width container
- [ ] Login form has email + password fields + submit + "Register" link
- [ ] Register form has email + password + display name + submit + "Login" link
- [ ] Loading state disables fields and shows spinner on button
- [ ] Error state shows inline error message
- [ ] All colors reference CSS variables (no hardcoded hex values)
- [ ] WCAG AA contrast ratios
- [ ] ARIA labels on all form inputs and buttons
- [ ] Verified via Playwright browser screenshot
