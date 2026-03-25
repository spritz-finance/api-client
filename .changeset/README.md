# Changesets

Every pull request must include a changeset.

- Run `yarn changeset` for any user-facing package change that should release.
- Run `yarn changeset --empty` for internal-only work like CI, docs, or tooling.

Merges to `main` update the automated release PR. Merging that release PR publishes the package.
