'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FavoriteTeam, FavoritePlayer } from '@/types';

// ── Teams ──────────────────────────────────────────────────────────────────

export function useFavoriteTeams() {
  return useQuery<FavoriteTeam[]>({
    queryKey: ['favorites', 'teams'],
    queryFn: async () => {
      const res = await fetch('/api/favorites/teams');
      if (!res.ok) throw new Error('Failed to fetch favorite teams');
      return res.json();
    },
  });
}

interface AddTeamPayload {
  teamId: string;
  sport: string;
  league: string;
  teamName: string;
  teamLogo?: string;
  teamColor?: string;
}

export function useToggleFavoriteTeam() {
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: async (payload: AddTeamPayload) => {
      const res = await fetch('/api/favorites/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add favorite team');
      return res.json() as Promise<FavoriteTeam>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', 'teams'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/favorites/teams/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove favorite team');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', 'teams'] }),
  });

  return { add, remove };
}

// ── Players ────────────────────────────────────────────────────────────────

export function useFavoritePlayers() {
  return useQuery<FavoritePlayer[]>({
    queryKey: ['favorites', 'players'],
    queryFn: async () => {
      const res = await fetch('/api/favorites/players');
      if (!res.ok) throw new Error('Failed to fetch favorite players');
      return res.json();
    },
  });
}

interface AddPlayerPayload {
  playerId: string;
  sport: string;
  league: string;
  playerName: string;
  playerPhoto?: string;
  teamName?: string;
  position?: string;
}

export function useToggleFavoritePlayer() {
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: async (payload: AddPlayerPayload) => {
      const res = await fetch('/api/favorites/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add favorite player');
      return res.json() as Promise<FavoritePlayer>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', 'players'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/favorites/players/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove favorite player');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', 'players'] }),
  });

  return { add, remove };
}
