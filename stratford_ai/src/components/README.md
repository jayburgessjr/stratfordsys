# Components Directory

This directory contains all React components for the Stratford AI dashboard.

## Structure

```
components/
├── dashboard/          # Main dashboard layout and components
├── strategy/           # Strategy configuration components
├── charts/            # Data visualization components
├── results/           # Results display and export components
└── ui/               # Shared UI components (shadcn/ui)
```

## Component Guidelines

1. **TypeScript First**: All components must use TypeScript
2. **Props Validation**: Use Zod schemas for complex prop validation
3. **Accessibility**: Follow WCAG guidelines
4. **Testing**: Each component should have corresponding tests
5. **Deterministic**: Components should render consistently given same props