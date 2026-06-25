# PinyinPal Development Guides

**Last Updated:** January 30, 2026  
**Purpose:** Comprehensive setup and workflow documentation for the PinyinPal project

> **For New Developers:** Start with [Quickstart](quickstart.md) → [Project Overview](project-overview.md) → [Environment Setup](environment-setup.md)

> **For Transferable Patterns:** See [`docs/knowledge-base/`](../../knowledge-base/) for concepts applicable to other projects

---

## ðŸš€ Getting Started

New to the project? Start here:

1. **[Quickstart](quickstart.md)** - Get the project running in 5 minutes
2. **[Project Overview](project-overview.md)** - Understand the monorepo structure and mental model
3. **[Environment Setup](environment-setup.md)** - Configure `.env.local` with all required variables

Then proceed to:

4. **[Frontend Development](../setup/frontend-development.md)** - React/TypeScript setup, component patterns, state management
5. **[Backend Development](../setup/backend-development.md)** - Express server, middleware, authentication setup
6. **[Database Setup](../setup/database.md)** - PostgreSQL/Prisma setup (local, Supabase, Railway)

---

## Integration Guides

### Frontend-Backend Communication

- **[Frontend-Backend Integration](../integrations/frontend-backend.md)** - CORS, cookie authentication, JWT tokens, API client setup

---

## Configuration Guides

### Development Environment

- **[Vite Setup](../setup/vite.md)** - Configure Vite dev server, proxy setup, environment variables
- **[Linting Setup](../setup/linting.md)** - ESLint and Prettier setup for code quality
- **[Frontend Testing](../testing/frontend.md)** - Vitest + React Testing Library setup and patterns
- **[Backend Testing](../testing/backend.md)** - Backend service, repository, and API testing

- **[Tooling Standards](../setup/tooling-standards.md)** - ESLint, TypeScript, Vitest monorepo configuration
- **[Frontend Conventions](../conventions/frontend.md)** - Frontend code style, naming, imports, exports, file structure
- **[Backend Conventions](../conventions/backend.md)** - Clean architecture, services, repositories, layer patterns
- **[API Client Patterns](../conventions/api-client.md)** - axiosClient, error handling, service layer integration
- **[State Management Patterns](../conventions/state-management.md)** - Reducers, actions, selectors, hooks patterns
- **[Git Convention](../conventions/git.md)** - Commit messages (Conventional Commits), branching, PR guidelines

### System Operations

- **[Infrastructure Setup](../operations/infrastructure.md)** - Terraform, database migrations, deployment, CI/CD, dependencies
- **[Redis Setup](../setup/redis.md)** - Set up and integrate Redis for caching, sessions, or rate limiting

### Code Quality & Review

- **[Review Checklist](../operations/review-checklist.md)** - Pre-commit and PR review checklist

---

## ðŸ“‹ Workflow Guides

### Development Process

- **[Development Workflow](../operations/workflow.md)** - Daily development process and best practices

### Documentation

- **[Documentation Patterns](../../knowledge-base/practices/documentation-patterns.md)** - Business requirements and implementation doc structure

---

## ðŸ”§ Troubleshooting

- **[Common Issues](../operations/troubleshooting.md)** - Known project-specific errors and solutions

---

## ðŸ§­ Quick Reference

### Quick Reference Card

| Need                     | Command/File                   | Guide                                                                                 |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------------------------- |
| Start dev server         | `npm run dev`                  | [quickstart](quickstart.md)                                                           |
| Start backend            | `npm run dev:backend`          | [backend-development](../setup/backend-development.md)                                |
| Run tests                | `npm test`                     | [frontend-testing](../testing/frontend.md) / [backend-testing](../testing/backend.md) |
| Configure env vars       | Edit `.env.local`              | [environment-setup](environment-setup.md)                                             |
| Frontend React setup     | `src/features/`                | [frontend-development](../setup/frontend-development.md)                              |
| Fix CORS/cookie issues   | Check integration guide â†’    | [frontend-backend-integration](../integrations/frontend-backend.md)                   |
| Database setup           | `DATABASE_URL` in `.env.local` | [database-setup](../setup/database.md)                                                |
| Database migrations      | `npm run db:migrate`           | [database-setup](../setup/database.md)                                                |
| Add new feature          | See workflow checklist â†’     | [workflow](../operations/workflow.md)                                                 |
| Troubleshooting          | Check error message â†’        | [troubleshooting](../operations/troubleshooting.md)                                   |
| Commit message format    | `type(scope): description`     | [git-convention](../conventions/git.md)                                               |
| Redis caching setup      | `REDIS_URL` in `.env.local`    | [redis-setup-guide](../setup/redis.md)                                                |
| State management pattern | Reducer + Context API          | [state-management-patterns](../conventions/state-management.md)                       |
| API client patterns      | Use axiosClient                | [api-client-patterns](../conventions/api-client.md)                                   |
| Backend architecture     | Services + Repositories        | [backend-conventions](../conventions/backend.md)                                      |
| Infrastructure setup     | Terraform, migrations          | [infrastructure-setup-guide](../operations/infrastructure.md)                         |

### ðŸ†˜ Common Issues at a Glance

- **Port 5173 in use** â†’ Kill process: `netstat -ano | findstr :5173` then `taskkill /PID <PID> /F`
- **Cookies not working** â†’ See [Frontend-Backend Integration Guide](../integrations/frontend-backend.md#cookies-not-visible-in-browser)
- **CORS error** â†’ See [Frontend-Backend Integration Guide](../integrations/frontend-backend.md#cors-error-credentials-mode-is-include)
- **Module not found** â†’ Run `npm install` + restart dev server
- **Changes not appearing** â†’ Hard refresh: `Ctrl+Shift+R`
- **Backend connection failed** â†’ Check `VITE_API_URL` in `.env.local`
- **Database connection error** â†’ See [Database Setup Guide](../setup/database.md#troubleshooting)

**Full troubleshooting:** See [Troubleshooting](../operations/troubleshooting.md) for 20+ documented issues

### Daily Development Commands

```bash
# Frontend
npm run dev                    # Start Vite dev server (port 5173)
npm test                       # Run tests
npm run lint                   # Lint code

# Backend
npm run dev:backend          # Start Express server (port 3001)
npm run db:migrate             # Run Prisma migrations
npm run db:studio              # Open Prisma Studio
```

### Key Files

| File                              | Purpose                                          |
| --------------------------------- | ------------------------------------------------ |
| `.env.local`                      | Single source of truth for environment variables |
| `vite.config.ts`                  | Vite configuration (proxy, plugins)              |
| `jest.config.js`                  | Test runner configuration                        |
| `prisma/schema.prisma`            | Database schema                                  |
| `.github/copilot-instructions.md` | AI coding agent operational guide                |

### Project Structure

```
mandarin-vite-react-ts/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ frontend/           # React + Vite + TypeScript
â”‚   â””â”€â”€ backend/            # Express + Prisma + PostgreSQL
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ guides/             # This folder (project-specific)
â”‚   â”œâ”€â”€ knowledge-base/     # Transferable patterns
â”‚   â”œâ”€â”€ business-requirements/
â”‚   â””â”€â”€ issue-implementation/
â”œâ”€â”€ packages/
â”‚   â”œâ”€â”€ shared-types/
â”‚   â””â”€â”€ shared-constants/
â””â”€â”€ .env.local              # Environment config (not committed)
```

---

## ðŸ“š Additional Resources

### External Docs

- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase Documentation](https://supabase.com/docs)

### Project-Specific Docs

- [Architecture Overview](../../architecture.md)
- [Epic & Story Index](../../business-requirements/README.md)
- [Knowledge Base Index](../../knowledge-base/README.md)

---

## ðŸŽ¯ How to Use These Guides

### For New Team Members

1. Start with [Quickstart](quickstart.md)
2. Read [Environment Setup](environment-setup.md)
3. Review [Frontend Conventions](../conventions/frontend.md)
4. Skim [Workflow](../operations/workflow.md) and [Git Convention](../conventions/git.md)
5. Keep [Troubleshooting](../operations/troubleshooting.md) handy

### For Feature Development

1. Check [Business Requirements](../../business-requirements/) for spec
2. Review [Frontend Conventions](../conventions/frontend.md) and [Backend Conventions](../conventions/backend.md) for patterns
3. Follow [Development Workflow](../operations/workflow.md)
4. Use [Review Checklist](../operations/review-checklist.md) before PR
5. Update [Implementation Docs](../../issue-implementation/)

### For Debugging

1. Check [Troubleshooting](../operations/troubleshooting.md) first
2. Review relevant setup guide:
   - Backend issues â†’ [Backend Development](../setup/backend-development.md)
   - Frontend issues â†’ [Frontend Development](../setup/frontend-development.md)
   - Database issues â†’ [Database Setup](../setup/database.md)
   - Proxy/cookie issues â†’ [Frontend-Backend Integration](../integrations/frontend-backend.md)
   - Environment issues â†’ [Environment Setup](environment-setup.md)

---

**For transferable knowledge and patterns**, see [`docs/knowledge-base/`](../../knowledge-base/)

---

## Related Guides

- [Linting Setup Guide](../setup/linting.md) - Quick-start ESLint/Prettier setup
- [Frontend Conventions](../conventions/frontend.md) - Code style and patterns
- [Backend Conventions](../conventions/backend.md) - Backend architecture patterns
- [Review Checklist](../operations/review-checklist.md) - Pre-commit and PR checks
- [Environment Setup Guide](environment-setup.md) - Environment variables
