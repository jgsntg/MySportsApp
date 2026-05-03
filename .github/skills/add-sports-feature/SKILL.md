---
name: Add Sports Data Feature
description: Use when scaffolding a new ESPN API endpoint, React Query hook, and component for displaying sports data
---

# Add Sports Data Feature

Scaffold a new data feature: ESPN API endpoint → React Query hook → UI component.

## Workflow

1. **Define types** in `src/types/index.ts`
2. **Add API route** in `src/app/api/sports/[endpoint]/route.ts`
3. **Create hook** in `src/hooks/use[Data].ts` using React Query
4. **Build component** in `src/components/[domain]/[Name]Card.tsx`
5. **Wire in page** and test dark mode

## Type Template

```tsx
// src/types/index.ts
export interface Team {
  id: string;
  name: string;
  logo: string;
  wins: number;
  losses: number;
}

export interface TeamsResponse {
  data: Team[];
  meta: { total: number };
}
```

## API Template

```tsx
// src/app/api/sports/teams/route.ts
import { fetchFromESPN } from '@/lib/api/espn';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await fetchFromESPN('/teams');
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}
```

## Hook Template

```tsx
// src/hooks/useTeams.ts
import { TeamsResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';

export const useTeams = () =>
  useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/sports/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json() as Promise<TeamsResponse>;
    },
  });
```

## Component Template

```tsx
// src/components/teams/TeamCard.tsx
import { Team } from '@/types';
import { Card } from '@/components/ui/card';

export interface TeamCardProps {
  team: Team;
}

export const TeamCard = ({ team }: TeamCardProps) => (
  <Card className="p-4">
    <h3 className="font-semibold">{team.name}</h3>
    <p className="text-sm text-gray-400 dark:text-gray-500">
      {team.wins}W - {team.losses}L
    </p>
  </Card>
);
```

## Page Template

```tsx
// src/app/(dashboard)/teams/page.tsx
'use client';

import { useTeams } from '@/hooks/useTeams';
import { TeamCard } from '@/components/teams/TeamCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeamsPage() {
  const { data, isLoading, error } = useTeams();

  if (error) return <div className="text-red-500">Failed to load teams</div>;

  return (
    <div className="grid gap-4">
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
      ) : (
        data?.data.map((team) => <TeamCard key={team.id} team={team} />)
      )}
    </div>
  );
}
```

## Checklist

- [ ] Types added and exported from `src/types/index.ts`
- [ ] API route handles errors and returns typed response
- [ ] Hook uses correct query key and error boundary
- [ ] Component works in light and dark modes
- [ ] Component tested with loading, error, and data states
- [ ] Page imports hook and displays component correctly
