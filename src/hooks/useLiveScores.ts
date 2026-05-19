'use client';

import { useState, useCallback } from 'react';
import type { Match } from '@/data/fixtures';

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