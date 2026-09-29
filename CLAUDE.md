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
- `yarn typecheck:contract` - Assert the hand-written `ProblemDetails` still matches the generated OpenAPI problem schemas (runs as part of `agent:check`)
- `yarn changeset` - Create a release note for a releasable change
- `yarn changeset --empty` - Record an internal-only change so PR checks still pass
- **Never run `yarn version-packages`** — this is handled by CI. Running it locally consumes the changesets and breaks the release pipeline.
- Merging a PR with `.changeset/*.md` files triggers the Release workflow, which opens a "Version Packages" PR automatically. Merging _that_ PR bumps the version on `main`; the Publish workflow runs on every push to `main` and publishes only when npm doesn't have that version yet (runs in the `production` environment).
- The repo's enterprise policy keeps `GITHUB_TOKEN` read-only. Set `CHANGESETS_GITHUB_TOKEN` in repo secrets so the release workflow can open the automated release PR.

## Publishing only from `main`

The `production` environment only accepts deployments from `main`, and `publish.yml` has no ref or dist-tag inputs. Every release is a reviewed merge to `main`; there are no maintenance branches or `legacy-*` dist-tags. A manual `gh workflow run publish.yml` re-runs the same check against `main`.

npm trusted publishing is keyed on the workflow file path and the `production` environment, so keep publishing in `publish.yml`.

## Problem details contract

`ProblemDetails` in `src/lib/error.ts` is hand-written, because the generated spec inlines a separate problem schema into every error response instead of sharing one component — there is no generated symbol to alias.

`src/lib/problemContract.ts` stops that drifting. It unions the declared keys of every `application/problem+json` body in `paths` and fails the build if either side gains a field the other lacks, naming the field. It emits no runtime code and is not bundled.

If `yarn codegen:rest` makes it fail:

- **`Type '"<field>"' does not satisfy the constraint 'never'`** on `ProblemContractIsCovered` — the API documents a problem field the SDK does not model. Add it to `ProblemDetails`, add a `set(problem, '<field>', read…)` line to `parseProblemDetails`, and add the row to the README table.
- The same error on `ProblemContractHasNoStaleFields` — the API stopped documenting a field the SDK still models. Removing it is a breaking change for consumers, so deprecate rather than delete unless the field never shipped.

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

- Oxlint for linting
- Oxfmt for code formatting
- All code must pass `yarn agent:check` before commit
