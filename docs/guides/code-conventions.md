# Project Conventions

## Code Style & Patterns

- Use TypeScript for all React code
- Use functional components and React hooks
- Prefer named function declarations for components (e.g., `function MyComponent() {}`) over `const MyComponent: React.FC = () => {}`
- Use `type` for type definitions instead of `interface` unless extending external types
- Use ES module import/export syntax (`import ... from ...`, `export ...`) for all code
- Always use explicit type annotations for function parameters, return values, and variables where type inference is not obvious
- Avoid using `any` type; prefer strict, specific types and leverage TypeScript's type system for safety
- Keep each feature in its own folder under [../src/features/](../src/features/)
- Put route constants in [../src/constants/paths.ts](../src/constants/paths.ts)
- Use React Router for navigation and routing
- Use the CSV-based vocabulary system with `csvLoader.ts`

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
- Files that export a PascalCase component, type, hook, context, or similar should use PascalCase for the filename (e.g., `MyComponent.tsx`, `MyType.ts`, `MyHook.ts`, `MyContext.tsx`).
- Tests: match the file/component name with `.test.ts(x)` suffix

## Project Structure

- [../src/features/](../src/features/): Main features (e.g., mandarin)
- [../public/data/](../public/data/): Static data files
  - [../public/data/vocabulary/](../public/data/vocabulary/): CSV vocabulary files (HSK3.0)
  - [../public/data/examples/](../public/data/examples/): Example sentences and usage
- [../src/utils/](../src/utils/): Utility functions (includes `csvLoader.ts`)
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

## CSV Vocabulary Format

- Store CSV vocabulary files in `../public/data/vocabulary/hsk3.0/band1/`
- Follow the standard format: `No,Chinese,Pinyin,English`
- Process with `csvLoader.ts` utility in `../src/utils/`
- Document any structure changes in implementation docs

## Commit Message & Pull Request Standards

- Use clear, descriptive commit messages
