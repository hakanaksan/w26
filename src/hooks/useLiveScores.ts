'use client';

import { useState, useCallback, useRef } from 'react';
import type { Match } from '@/data/fixtures';

interface GoalEvent {
  minute: number | null;
  playerName: string;
  teamName: string;
  teamCode: string;
  isPenalty: boolean;
  isOwnGoal: boolean;
}

interface LiveScoreMatch {
  id: string;
  source: string;
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  date: string;
  time: string;
  isLive: boolean;
  isCompleted: boolean;
  goals: GoalEvent[];
  minute: number | null;
}

interface LiveScoresResult {
  liveMatches: LiveScoreMatch[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isApiConfigured: boolean;
  refresh: () => Promise<void>;
}

function matchApiToLocal(localMatch: Match, apiMatches: LiveScoreMatch[]): { homeScore: number | null; awayScore: number | null; isCompleted: boolean; isLive: boolean } | null {
  for (const api of apiMatches) {
    const dateMatch = localMatch.date === api.date;
    const homeMatch = api.homeCode ? localMatch.homeTeamId === api.homeCode : false;
    const awayMatch = api.awayCode ? localMatch.awayTeamId === api.awayCode : false;
    if (dateMatch && homeMatch && awayMatch) {
      return {
        homeScore: api.homeScore,
        awayScore: api.awayScore,
        isCompleted: api.isCompleted,
        isLive: api.isLive,
      };
    }
  }
  return null;
}

export function useLiveScores(matches: Match[]): LiveScoresResult & { mergedMatches: Match[] } {
  const [liveMatches, setLiveMatches] = useState<LiveScoreMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState(true);
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/live-scores?date=${today}`);
      const data = await response.json();

      if (data.source === 'manual') {
        setIsApiConfigured(false);
        setLiveMatches([]);
      } else if (data.source === 'error') {
        setError(data.message);
        setLiveMatches([]);
      } else {
        setIsApiConfigured(true);
        setLiveMatches(data.matches || []);
        setLastUpdated(data.fetchedAt);

        const apiMatches: LiveScoreMatch[] = data.matches || [];
        const currentMatches = matchesRef.current;
        for (const local of currentMatches) {
          const apiResult = matchApiToLocal(local, apiMatches);
          if (apiResult && (apiResult.isCompleted || apiResult.isLive || apiResult.homeScore !== null)) {
            fetch('/api/scores', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ matchId: local.id, homeScore: apiResult.homeScore ?? 0, awayScore: apiResult.awayScore ?? 0 }),
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Canlı skorlar alınamadı');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const mergedMatches: Match[] = matches.map(localMatch => {
    const apiResult = matchApiToLocal(localMatch, liveMatches);
    if (apiResult && (apiResult.isCompleted || apiResult.isLive || apiResult.homeScore !== null)) {
      return {
        ...localMatch,
        homeScore: apiResult.homeScore ?? localMatch.homeScore,
        awayScore: apiResult.awayScore ?? localMatch.awayScore,
        isCompleted: apiResult.isCompleted || localMatch.isCompleted,
      };
    }
    return localMatch;
  });

  return {
    liveMatches,
    mergedMatches,
    isLoading,
    error,
    lastUpdated,
    isApiConfigured,
    refresh,
  };
}