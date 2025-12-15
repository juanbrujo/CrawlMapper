# Agents

This document describes the various agents and components used in the CrawlMapper project.

## Core Agents

### 1. Sitemap Crawler Agent

**Purpose**: Discovers and crawls XML sitemaps to extract URL lists
**File**: `index.js`
**Responsibilities**:

- Parse XML sitemap files
- Extract URL lists recursively
- Handle different sitemap formats
- Manage crawl depth and rate limiting

### 2. Content Search Agent

**Purpose**: Searches for specific terms in webpage content
**File**: `netlify/functions/search.js`
**Responsibilities**:

- Fetch webpage content
- Extract text content
- Perform term matching
- Return search results with context

### 3. Build Agent

**Purpose**: Handles production builds and optimizations
**Files**: Various build scripts
**Responsibilities**:

- Remove console.log statements
- Strip comments and whitespace
- Minify JavaScript and CSS
- Optimize assets for production

## Development Agents

### 4. Test Agent

**Purpose**: Runs automated tests and validation
**File**: `vitest.config.js`
**Responsibilities**:

- Execute unit tests
- Run integration tests
- Validate code quality
- Generate coverage reports

### 5. Lint Agent

**Purpose**: Enforces code quality and style standards
**Files**: `eslint.config.js`, `.eslintrc.json`
**Responsibilities**:

- Check JavaScript syntax
- Enforce 2-space indentation
- Validate coding conventions
- Fix auto-fixable issues

### 6. Format Agent

**Purpose**: Maintains consistent code formatting
**File**: `.prettierrc.json`
**Responsibilities**:

- Format JavaScript, HTML, CSS
- Enforce 2-space indentation
- Standardize quote styles
- Ensure proper line endings

## Deployment Agents

### 7. Release Agent

**Purpose**: Manages versioning and releases
**Files**: `package.json`, `.versionrc`
**Responsibilities**:

- Bump semantic versions
- Generate changelogs
- Create git tags
- Publish to npm

### 8. Commit Agent

**Purpose**: Enforces commit message standards
**Files**: `.gitmessage`, `.husky/commit-msg`
**Responsibilities**:

- Validate conventional commits
- Provide commit templates
- Ensure proper formatting
- Generate release notes

## Configuration Agents

### 9. Hook Agent

**Purpose**: Manages git hooks for automation
**Files**: `.husky/pre-commit`, `.husky/commit-msg`
**Responsibilities**:

- Run pre-commit checks
- Validate commit messages
- Execute test suites
- Perform linting and formatting

### 10. Netlify Agent

**Purpose**: Handles deployment to Netlify
**Files**: `netlify.toml`, `netlify/functions/`
**Responsibilities**:

- Configure build settings
- Manage serverless functions
- Handle environment variables
- Optimize deployment pipeline

## Agent Communication

### Data Flow

1. **Sitemap Crawler** → Extracts URLs → Content Search Agent
2. **Content Search** → Processes requests → Returns results
3. **Build Agent** → Processes code → Removes logs/comments
4. **All Agents** → Follow coding standards → Pass lint/format checks

### Quality Gates

- All agents must pass ESLint validation
- All code must follow 2-space indentation
- All commits must use conventional format
- All builds must strip console.log and comments
- All functions must preserve console.error for debugging

## Maintenance

### Regular Tasks

- Update agent dependencies monthly
- Review and update agent documentation
- Monitor agent performance and logs
- Update configuration files as needed
- Ensure compatibility with latest standards

### Performance Monitoring

- Track build times and optimization
- Monitor lint/format execution speed
- Review test coverage and quality
- Analyze deployment success rates
- Document any agent-specific issues

This agent-based architecture ensures modular, maintainable, and scalable code organization for the CrawlMapper project.
