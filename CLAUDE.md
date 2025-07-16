# Claude Development Notes

## Package Manager
- This project uses **Yarn** as the package manager
- Use `yarn` instead of `npm` for all package operations
- Examples:
  - `yarn install` (not `npm install`)
  - `yarn add package-name` (not `npm install package-name`)
  - `yarn add --dev package-name` (not `npm install --save-dev package-name`)
  - `yarn test` (not `npm test`)
  - `yarn build` (not `npm run build`)

## Development Commands
- `yarn test` - Run tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage
- `yarn test:ui` - Run tests with UI
- `yarn build` - Build the project
- `yarn codegen` - Generate GraphQL types
- `yarn demo` - Run demo script

## Testing
- Uses Vitest for testing
- MSW (Mock Service Worker) for API mocking
- Tests should cover all services and GraphQL operations
- Security tests are included for GraphQL validation

## Security Features
- GraphQL query validation (depth & complexity limiting)
- Prototype pollution protection
- Input sanitization for GraphQL variables
- Safe header manipulation

## Code Quality
- ESLint with TypeScript support
- Prettier for code formatting
- All code must pass linting and tests before commit