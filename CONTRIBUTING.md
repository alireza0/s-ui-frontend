# Contributing to S-UI-Frontend

Thank you for your interest in contributing to S-UI-Frontend. This document explains how to set up the project, follow our conventions, and submit changes.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Please be respectful and constructive. This project is for personal learning and communication; do not use it for illegal purposes or in production without proper evaluation.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/s-ui-frontend.git
   cd s-ui-frontend
   ```
3. Add the upstream remote (optional, for syncing):
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/s-ui-frontend.git
   ```

## Development Setup

### Prerequisites

- Node.js (recommended: LTS)
- A package manager: npm, yarn, pnpm, or bun

### Install dependencies

```bash
# npm
npm install

# yarn
yarn

# pnpm
pnpm install

# bun
bun install
```

### Run development server

```bash
npm run dev
# or: yarn dev | pnpm dev | bun run dev
```

The app will be available at the URL shown in the terminal (e.g. `http://localhost:5173`).

### Build and lint

```bash
# Type-check and build
npm run build

# Lint and auto-fix
npm run lint
```

Make sure `npm run build` and `npm run lint` pass before submitting a pull request.

## Project Structure

- `src/` – Application source
  - `components/` – Reusable Vue components (including `protocols/`, `tiles/`, `tls/`, `transports/`)
  - `layouts/` – Layouts (`default/`) and modals (`modals/`)
  - `views/` – Page-level views
  - `locales/` – i18n translations (en, fa, ru, vi, zhcn, zhtw)
  - `plugins/` – Vue plugins and utilities
  - `router/` – Vue Router configuration
  - `store/` – Pinia store and modules
  - `types/` – TypeScript type definitions
  - `styles/` – Global styles (e.g. SCSS)

## Code Style

- **EditorConfig:** The project uses [EditorConfig](https://editorconfig.org). Use 2 spaces for indentation, trim trailing whitespace, and insert a final newline (see `.editorconfig`).
- **ESLint:** We use ESLint with Vue 3 and TypeScript. Run `npm run lint` to check and fix.
- **Vue:** Follow Vue 3 Composition API or Options API consistently within a file. Use TypeScript where it improves clarity.
- **Naming:** Use clear, descriptive names for components, variables, and functions.

## Submitting Changes

1. Create a **branch** from `main` (or the current default branch):
   ```bash
   git checkout -b feature/your-feature-name
   # or: fix/your-bug-description
   ```
2. Make your changes. Keep commits focused and messages clear (e.g. `feat: add X`, `fix: resolve Y`).
3. Run **lint** and **build**:
   ```bash
   npm run lint
   npm run build
   ```
4. **Push** to your fork and open a **Pull Request** against the upstream repository.
5. Describe what you changed and why. Reference any related issues.

## Reporting Issues

- **Bugs:** Use the [Bug report](.github/ISSUE_TEMPLATE/bug_report.md) template. Include steps to reproduce, expected vs actual behavior, and environment (OS, browser, version).
- **Features:** Use the [Feature request](.github/ISSUE_TEMPLATE/feature_request.md) template.
- **Questions:** Use the [Question](.github/ISSUE_TEMPLATE/question-template.md) template.

Search existing issues first to avoid duplicates.

---

Thank you for contributing.
