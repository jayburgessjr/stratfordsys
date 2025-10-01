# Stratford AI - Dependencies Overview

## Production Dependencies

### Core Framework
- **next**: 14.0.4 - React framework with SSR/SSG
- **react**: 18.2.0 - React library
- **react-dom**: 18.2.0 - React DOM renderer

### UI Components & Styling
- **@radix-ui/react-slot**: 1.0.2 - Radix UI primitive for component composition
- **class-variance-authority**: 0.7.0 - Component variants utility
- **clsx**: 2.0.0 - Conditional class name utility
- **lucide-react**: 0.295.0 - Icon library
- **tailwind-merge**: 2.2.0 - Tailwind CSS class merging utility

### Forms & Validation
- **@hookform/resolvers**: 3.3.2 - Form validation resolvers
- **react-hook-form**: 7.47.0 - Performant forms with easy validation
- **zod**: 3.22.4 - TypeScript-first schema validation

### Data Visualization
- **recharts**: 2.8.0 - Composable charting library for React

## Development Dependencies

### TypeScript & Types
- **typescript**: 5.2.2 - TypeScript compiler
- **@types/node**: 20.10.5 - Node.js type definitions
- **@types/react**: 18.2.45 - React type definitions
- **@types/react-dom**: 18.2.18 - React DOM type definitions

### Build Tools & Styling
- **autoprefixer**: 10.4.16 - PostCSS plugin for vendor prefixes
- **postcss**: 8.4.32 - CSS transformation tool
- **tailwindcss**: 3.3.6 - Utility-first CSS framework
- **tailwindcss-animate**: 1.0.7 - Animation utilities for Tailwind

### Code Quality
- **eslint**: 8.56.0 - JavaScript/TypeScript linter
- **eslint-config-next**: 14.0.4 - ESLint configuration for Next.js
- **prettier**: 3.1.1 - Code formatter

### Testing
- **vitest**: 1.0.4 - Vite-powered unit test framework
- **@vitest/ui**: 1.0.4 - Vitest UI dashboard
- **jsdom**: 23.0.1 - DOM implementation for testing
- **@testing-library/react**: 14.1.2 - React testing utilities
- **@testing-library/jest-dom**: 6.1.5 - Custom Jest matchers for DOM
- **@playwright/test**: 1.40.1 - End-to-end testing framework
- **msw**: 1.3.2 - Mock Service Worker for API mocking

## Package Manager Configuration

- **pnpm**: 8.10.5 - Fast, disk space efficient package manager
- **Exact versions**: All dependencies pinned for deterministic builds

## Architecture Alignment

All dependencies selected to support:

1. **Deterministic Building**: Exact version pinning ensures reproducible builds
2. **Type Safety**: Strong TypeScript support throughout the stack
3. **Financial Precision**: Libraries chosen for accuracy in calculations
4. **Testing Excellence**: Comprehensive testing setup with unit, integration, and E2E
5. **Performance**: Optimized libraries for financial data processing
6. **Developer Experience**: Modern tooling with excellent IDE support

## Next Steps

With all core dependencies installed, we're ready to proceed to:
- Step 3: Configure development environment
- Step 4: Create type definitions and schemas
- Phase 2: Data layer implementation