# Project Conventions

## Code Style & Patterns

- Use TypeScript for all React code
- Use functional components and React hooks
- Keep each feature in its own folder under [../src/features/](../src/features/)
- Put route constants in [../src/constants/paths.ts](../src/constants/paths.ts)
- Use React Router for navigation and routing

## Routing Conventions

- Place page components in `pages` subdirectory of feature
- Use nested routes for complex features
- Define routes in feature's `router` directory
- Use path constants from `src/constants/paths.ts`
- Route parameters should be type-safe using generics
- Support browser history navigation

## Naming Rules

- Components: PascalCase (e.g., `MyComponent.tsx`)
- Variables/functions: camelCase (e.g., `myFunction`)
- Folders/files: kebab-case or lower-case (e.g., `my-feature`)
- Tests: match the file/component name with `.test.ts(x)` suffix

## Project Structure

- [../src/features/](../src/features/): Main features (e.g., mandarin)
- [../public/data/](../public/data/): Static JSON data (vocabulary, examples)
- [../src/components/](../src/components/): Reusable UI components
- [../api/](../api/): Serverless functions (e.g., TTS)
- [../local-backend/](../local-backend/): Local development server

## Testing Practices

- Put tests next to the code they test
- Use Jest and React Testing Library (if available)
- Name test files as `ComponentName.test.tsx` or `file.test.ts`

## Documentation Organization

- High-level docs in [./](./)
- Feature docs in `../src/features/<feature>/docs/`
- Use [../docs/business-requirements/](../business-requirements/) for business requirements and planning
- Use [../docs/issue-implementation/](../issue-implementation/) for technical implementation docs

## Commit Message & Pull Request Standards

- Use clear, descriptive commit messages
