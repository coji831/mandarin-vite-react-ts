# Frontend Application

React + TypeScript + Vite application for PinyinPal Mandarin learning platform.

> **For detailed setup, architecture patterns, state management, and development workflow:** See [Frontend Development Guide](../../docs/guides/setup/frontend-development.md).

## Quick Start

```bash
# Install dependencies (from project root)
npm install

# Start development server
npm run dev  # Runs on http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

## Available Scripts

| Command                 | Description                      |
| ----------------------- | -------------------------------- |
| `npm run dev`           | Start Vite dev server with HMR   |
| `npm run build`         | Production build to `dist/`      |
| `npm run preview`       | Preview production build locally |
| `npm test`              | Run all tests (Vitest + RTL)     |
| `npm run test:watch`    | Run tests in watch mode          |
| `npm run test:coverage` | Run tests with coverage report   |

## Environment

```env
VITE_API_URL=http://localhost:3001  # Backend URL (dev)
```

> All frontend vars must start with `VITE_`. See [Environment Setup Guide](../../docs/guides/getting-started/environment-setup.md).

## References

- [Frontend Development Guide](../../docs/guides/setup/frontend-development.md) — Setup, architecture, conventions
- [Frontend Conventions](../../docs/guides/conventions/frontend.md) — Coding standards and patterns
- [State Management Patterns](../../docs/guides/conventions/state-management.md) — Context + reducer patterns
- [API Client Patterns](../../docs/guides/conventions/api-client.md) — Service layer conventions
- [Features README](../../docs/../apps/frontend/src/features/README.md) — Feature module organization
- [Routing Constants](../../docs/../apps/frontend/src/shared/constants/paths.ts) — Type-safe route definitions

```env
VITE_API_URL=https://your-backend.railway.app
```

**Build Settings**:

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Configuration Files

- **`vite.config.ts`**: Vite configuration with dev proxy, aliases, plugins
- **`tsconfig.json`**: TypeScript configuration (strict mode enabled)
- **`vitest.config.ts`**: Vitest test configuration
- **`package.json`**: Dependencies and scripts

## Related Documentation

- **System Architecture**: [../../docs/architecture.md](../../docs/architecture.md)
- **Code Conventions**: [../../docs/guides/conventions/frontend.md](../../docs/guides/conventions/frontend.md)
- **Vite Configuration**: [../../docs/guides/setup/vite.md](../../docs/guides/setup/vite.md)
- **Testing Guide**: [../../docs/guides/testing/frontend.md](../../docs/guides/testing/frontend.md)
- **React Patterns**: [../../docs/knowledge-base/frontend-react-patterns.md](../../docs/knowledge-base/frontend-react-patterns.md)
- **State Management**: [../../docs/knowledge-base/frontend-state-management.md](../../docs/knowledge-base/frontend-state-management.md)

## Troubleshooting

### Common Issues

**Port 5173 already in use**:

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change port in vite.config.ts
server: { port: 5174 }
```

**Module not found errors**:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors after git pull**:

```bash
# Regenerate types
npm run build
```

**Cookies not working in development**:

- Verify Vite proxy is configured with `credentials: 'include'`
- Check backend CORS allows credentials
- See [Vite Configuration Guide](../../docs/guides/setup/vite.md)

**More Help**: See [Troubleshooting Guide](../../docs/guides/operations/troubleshooting.md)
