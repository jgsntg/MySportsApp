---
name: React Component Guidelines
description: Use when writing or modifying React components (.tsx files) — component structure, hooks, styling, and composition patterns for MySports
applyTo: "src/components/**/*.tsx"
---

# React Component Guidelines

## Component Structure

```tsx
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'outline';
  isLoading?: boolean;
  children: ReactNode;
}

export const Component = ({ className, variant, isLoading, ...props }: ComponentProps) => (
  <div className={cn('base classes', variant && 'variant-specific', className)} {...props}>
    {isLoading ? <Skeleton /> : props.children}
  </div>
);
Component.displayName = 'Component';
```

## Patterns

**Data Fetching**: Use React Query with `useQuery`. Pass query state to children; don't render loading states inside component.

```tsx
const { data, isLoading, error } = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });
return <TeamList teams={data} isLoading={isLoading} error={error} />;
```

**Styling**: Use Tailwind + CVA. Merge with `cn()`. Avoid inline styles.

```tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva('base', { variants: { ... } });
className={cn(buttonVariants({ variant }), className)}
```

**Composition**: Prefer small, focused components. Pass state down, events up.

**No Forwarding Boilerplate**: Only use `forwardRef` for UI base components (Button, Input, Card). Page and feature components don't need it.

## Dark Mode

All components must work in dark theme (Tailwind's `dark:` prefix). Test both modes before committing.
