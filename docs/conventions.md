# Project Conventions

## Coding Standards

- Use TypeScript for all React code
- Use functional components and React hooks
- Keep each feature in its own folder under [../src/features/](../src/features/)
- Put route constants in [../src/constants/paths.ts](../src/constants/paths.ts)

## Naming Conventions

- Components: PascalCase (e.g., `MyComponent.tsx`)
- Variables/functions: camelCase (e.g., `myFunction`)
- Folders/files: kebab-case or lower-case (e.g., `my-feature`)
- Tests: match the file/component name with `.test.ts(x)` suffix

## File/Folder Structure

- [../src/features/](../src/features/): Main features (e.g., mandarin)
- [../public/data/](../public/data/): Static JSON data (vocabulary, examples)
- [../src/components/](../src/components/): Reusable UI components
- [../api/](../api/): Serverless functions (e.g., TTS)
- [../local-backend/](../local-backend/): Local development server

## Testing

- Put tests next to the code they test
- Use Jest and React Testing Library (if available)
- Name test files as `ComponentName.test.tsx` or `file.test.ts`

## Documentation

- High-level docs in [./](./)
- Feature docs in `../src/features/<feature>/docs/`
- Use [../docs/business-requirements/](../business-requirements/) for business requirements and planning
- Use [../docs/issue-implementation/](../issue-implementation/) for technical implementation docs

## Commit & PR Guidelines

- Use clear, descriptive commit messages
- Reference issues or stories in PRs
- Keep PRs focused and small when possible

## Linting & Formatting

- Use ESLint for code linting
- Use Prettier for code formatting

## Future Conventions (Placeholder)

- Add more as the project grows
