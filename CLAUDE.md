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
- `yarn changeset` - Create a release note for a releasable change
- `yarn changeset --empty` - Record an internal-only change so PR checks still pass
- **Never run `yarn version-packages`** — this is handled by CI. Running it locally consumes the changesets and breaks the release pipeline.
- Merging a PR with `.changeset/*.md` files triggers the Release workflow, which opens a "Version Packages" PR automatically. Merging _that_ PR triggers the Publish workflow (runs in the `production` environment).
- The repo's enterprise policy keeps `GITHUB_TOKEN` read-only. Set `CHANGESETS_GITHUB_TOKEN` in repo secrets so the release workflow can open the automated release PR.

## Maintenance releases (diverged version chains)

When `main` ships a breaking change but we still need to patch an older minor (e.g. a customer is pinned to `0.7.x` and won't upgrade), publish from a long-lived maintenance branch via the same `publish.yml` workflow that handles main-line releases.

### When to cut a maintenance branch

- A breaking change is about to land on `main` AND at least one consumer can't upgrade soon.
- Cut the branch _before_ merging the breaking change, from the last commit of the soon-to-be-old minor (the `Version Packages` merge commit for that version is the canonical fork point).
- A minor having published versions does NOT mean it's maintained. `npm view @spritz-finance/api-client dist-tags` is the authority: a line is only being consumed if it has a `legacy-0.X` tag. Absent that, those versions were ordinary main-line releases that a later minor superseded — don't cut a branch for them.

### Branch naming

- `release/0.7`, `release/0.8`, … — one branch per maintained minor.
- Push to origin so CI and other engineers can use it.

### Authoring a patch on a maintenance branch

1. Check out `release/0.X`, branch off, apply the fix.
2. **Hand-bump `package.json`** (`0.7.1` → `0.7.2`). Maintenance branches do NOT use changesets to determine the version — changesets' `baseBranch` is `main` and trying to share its machinery across branches breaks. `package.json` is the source of truth here.
3. **Add an empty changeset** (`yarn changeset --empty`). The required `changeset` PR check runs against `release/0.X` too and fails the PR without one. It is never consumed — `release/0.X` never runs `version-packages` — it exists purely to satisfy the check, so say so in the body along with the version being shipped.
4. **Hand-edit `CHANGELOG.md`** with an entry for the new version. Follow the existing entries: `## 0.7.5` → `### Patch Changes` → a bullet describing the change, noting it's a backport.
5. PR against `release/0.X`, get review, merge.

### Publishing

Trigger `publish.yml` manually with the `dist-tag` input set:

```
gh workflow run publish.yml --ref main \
  -f ref=release/0.7 \
  -f dist-tag=legacy-0.7
```

- `--ref main` is correct — `workflow_dispatch` reads the workflow file from the default branch, then checks out `inputs.ref` for the build.
- `dist-tag` is optional. **Leave it blank** for normal main-line publishes (changesets handles `latest`). **Set it** for maintenance releases.
- `dist-tag` **must not be `latest`** and **must not parse as a SemVer range** — `0.7`, `0.7.x`, `~0.7` all get rejected by npm. Use `legacy-0.7` or similar.
- Consumers pin via `npm install @spritz-finance/api-client@legacy-0.7`.

### Why one workflow

npm trusted publishing allows only one trusted publisher per package, keyed on the workflow file path. Keeping all publishes in `publish.yml` means the single existing trusted-publishing entry covers both main and maintenance releases.

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
