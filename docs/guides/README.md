# Project Guides

**Last Updated:** January 9, 2026  
**Purpose:** Actionable setup and workflow documentation for THIS project

> **Use this when:** You need to set up, configure, or understand workflows specific to THIS codebase.  
> **For transferable patterns:** See [`docs/knowledge-base/`](../knowledge-base/) for concepts applicable to other projects.

---

## 🚀 Getting Started

Start here if you're new to the project:

1. **[Quickstart](quickstart.md)** - Get the project running in 5 minutes
2. **[Environment Setup](environment-setup-guide.md)** - Configure `.env.local` and required variables
3. **[Backend Setup](backend-setup-guide.md)** - Express server, CORS, middleware configuration
4. **[Supabase Setup](supabase-setup-guide.md)** - Database connection and pooling

---

## 🛠️ Configuration Guides

### Development Environment

- **[Vite Configuration](vite-configuration-guide.md)** - Dev proxy, cookie forwarding, environment-aware settings
- **[Linting](linting-guide.md)** - ESLint and Prettier setup for code quality
- **[Testing](testing-guide.md)** - Jest + React Testing Library setup and patterns

### Backend Services

- **[Redis Caching](redis-caching-guide.md)** - Railway Redis setup, caching strategy, monitoring, troubleshooting

### Code Quality

- **[Code Conventions](code-conventions.md)** - Project coding standards, state management patterns
- **[Review Checklist](review-checklist.md)** - Pre-commit and PR review checklist

---

## 📋 Workflow Guides

### Development Process

- **[Development Workflow](workflow.md)** - Daily development process and best practices
- **[Git Convention](git-convention.md)** - Branch naming, commit messages, PR process

### Documentation

- **[Business Requirements Format](business-requirements-format-guide.md)** - Epic and story BR structure
- **[Implementation Format](implementation-format-guide.md)** - Technical implementation doc structure

---

## 🔧 Troubleshooting

- **[Common Issues](troubleshooting.md)** - Known project-specific errors and solutions

---

## 🧭 Quick Reference

### Daily Development Commands

```bash
# Frontend
npm run dev                    # Start Vite dev server (port 5173)
npm test                       # Run tests
npm run lint                   # Lint code

# Backend
npm run start-backend          # Start Express server (port 3001)
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
├── apps/
│   ├── frontend/           # React + Vite + TypeScript
│   └── backend/            # Express + Prisma + PostgreSQL
├── docs/
│   ├── guides/             # This folder (project-specific)
│   ├── knowledge-base/     # Transferable patterns
│   ├── business-requirements/
│   └── issue-implementation/
├── packages/
│   ├── shared-types/
│   └── shared-constants/
└── .env.local              # Environment config (not committed)
```

---

## 📚 Additional Resources

### External Docs

- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase Documentation](https://supabase.com/docs)

### Project-Specific Docs

- [Architecture Overview](../architecture.md)
- [Epic & Story Index](../business-requirements/README.md)
- [Knowledge Base Index](../knowledge-base/README.md)

---

## 🎯 How to Use These Guides

### For New Team Members

1. Start with [Quickstart](quickstart.md)
2. Read [Environment Setup](environment-setup-guide.md)
3. Review [Code Conventions](code-conventions.md)
4. Skim [Workflow](workflow.md) and [Git Convention](git-convention.md)
5. Keep [Troubleshooting](troubleshooting.md) handy

### For Feature Development

1. Check [Business Requirements](../business-requirements/) for spec
2. Review [Code Conventions](code-conventions.md) for patterns
3. Follow [Development Workflow](workflow.md)
4. Use [Review Checklist](review-checklist.md) before PR
5. Update [Implementation Docs](../issue-implementation/)

### For Debugging

1. Check [Troubleshooting](troubleshooting.md) first
2. Review relevant setup guide:
   - Backend issues → [Backend Setup](backend-setup-guide.md)
   - Database issues → [Supabase Setup](supabase-setup-guide.md)
   - Proxy/cookie issues → [Vite Configuration](vite-configuration-guide.md)
   - Environment issues → [Environment Setup](environment-setup-guide.md)

---

**For transferable knowledge and patterns**, see [`docs/knowledge-base/`](../knowledge-base/)
