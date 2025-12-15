# Semantic Versioning and Commit Message Guide

This project now uses semantic versioning (semver) with conventional commit messages and automatic release management.

## Commit Message Format

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Examples

```bash
# Feature addition
git commit -m "feat(auth): add user login functionality"

# Bug fix
git commit -m "fix(ui): resolve button alignment issue"

# Documentation update
git commit -m "docs: update installation instructions"

# Breaking change
git commit -m "feat(api): remove deprecated endpoint

BREAKING CHANGE: The /old-endpoint API has been removed.
Use /new-endpoint instead."
```

## Version Management

### Available Release Scripts

- `npm run release` - Create a release with automatic version bumping based on commits
- `npm run release:patch` - Create a patch release (x.x.1)
- `npm run release:minor` - Create a minor release (x.1.x)
- `npm run release:major` - Create a major release (1.x.x)

### How It Works

1. **Commit Messages**: Use conventional commit format
2. **Version Bumping**: `standard-version` analyzes commits since last release
   - `feat` commits → minor version bump
   - `fix` commits → patch version bump
   - BREAKING CHANGE in footer → major version bump
3. **Automatic Actions**:
   - Updates `package.json` version
   - Updates `package-lock.json` version
   - Updates `CHANGELOG.md` with new release notes
   - Creates a git tag (e.g., `v2.2.1`)
   - Commits all changes

### Example Release Workflow

```bash
# Make your changes with proper commit messages
git add .
git commit -m "feat(search): add advanced filtering options"

# Create a release (will bump to next minor version)
npm run release

# Push changes and tags
git push --follow-tags origin main

# Publish to npm (if needed)
npm publish
```

## Git Hooks

The project includes automated git hooks:

- **pre-commit**: Runs tests before allowing commits (if test files exist)
- **commit-msg**: Validates commit messages follow conventional commit format

## Files Modified During Release

- `package.json` - Version number updated
- `package-lock.json` - Version number updated
- `CHANGELOG.md` - New release notes added
- Git tags created automatically

## Configuration Files

- `.gitmessage` - Commit message template (used by git config)
- `.versionrc` - Configuration for standard-version
- `.husky/commit-msg` - Commit message validation hook
- `.husky/pre-commit` - Pre-commit test hook
- `package.json` - Contains commitlint configuration and release scripts

## Benefits

1. **Automated Versioning**: No manual version number management
2. **Changelog Generation**: Automatic release notes from commit history
3. **Consistent Commits**: Enforced commit message format
4. **Breaking Change Detection**: Automatic major version bumps for breaking changes
5. **Git Tagging**: Automatic semantic version tags
6. **Test Integration**: Tests run before commits

This system ensures consistent, automated versioning and release management following industry best practices.