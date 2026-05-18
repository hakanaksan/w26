'use client';

import { useState } from 'react';
import { teams } from '@/data/teams';
import type { Match } from '@/data/fixtures';

interface MatchCardProps {
  match: Match;
  onScoreUpdate?: (matchId: string, homeScore: number, awayScore: number) => void;
  onNotify?: (matchId: string) => void;
}

export default function MatchCard({ match, onScoreUpdate, onNotify }: MatchCardProps) {
  const [homeScore, setHomeScore] = useState(match.homeScore ?? '');
  const [awayScore, setAwayScore] = useState(match.awayScore ?? '');
  const [isEditing, setIsEditing] = useState(false);

  const homeTeam = teams.find(t => t.id === match.homeTeamId);
  const awayTeam = teams.find(t => t.id === match.awayTeamId);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Final': return 'bg-fifa-gold/20 text-fifa-gold';
      case 'Semi Final': return 'bg-purple-500/20 text-purple-400';
      case 'Quarter Final': return 'bg-blue-500/20 text-blue-400';
      case 'Round of 16': return 'bg-green-500/20 text-green-400';
      case 'Round of 32': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleSaveScore = () => {
    if (onScoreUpdate && homeScore !== '' && awayScore !== '') {
      onScoreUpdate(match.id, Number(homeScore), Number(awayScore));
      setIsEditing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="match-card">
      <div className="flex items-center justify-between mb-3">
        <span className={`stage-badge ${getStageColor(match.stage)}`}>
          {match.stage}
        </span>
        {match.group && (
          <span className="text-xs text-gray-500">Group {match.group}</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1 flex items-center gap-3">
          <span className="text-2xl">{homeTeam?.flag || '🏳️'}</span>
          <div>
            <p className="font-semibold text-white">{homeTeam?.name || match.homeTeamId}</p>
            <p className="text-xs text-gray-500">{homeTeam?.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4">
          {isEditing ? (
            <>
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={e => setHomeScore(e.target.value)}
                className="input-field w-12 text-center"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={e => setAwayScore(e.target.value)}
                className="input-field w-12 text-center"
              />
            </>
          ) : (
            <div className="text-center">
              {match.isCompleted || match.homeScore !== undefined ? (
                <p className="text-2xl font-bold text-white">
                  {match.homeScore} - {match.awayScore}
                </p>
              ) : (
                <p className="text-lg font-semibold text-fifa-gold">{match.time}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="text-right">
            <p className="font-semibold text-white">{awayTeam?.name || match.awayTeamId}</p>
            <p className="text-xs text-gray-500">{awayTeam?.code}</p>
          </div>
          <span className="text-2xl">{awayTeam?.flag || '🏳️'}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(match.date)} • {match.time}</span>
        <span>{match.venue}, {match.city}</span>
      </div>

      <div className="mt-3 flex gap-2">
        {onScoreUpdate && (
          <button
            onClick={() => isEditing ? handleSaveScore() : setIsEditing(true)}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            {isEditing ? 'Save' : 'Enter Score'}
          </button>
        )}
        {onNotify && !match.isCompleted && (
          <button
            onClick={() => onNotify(match.id)}
            className="btn-primary text-xs py-1.5 px-3"
          >
            🔔 Notify
          </button>
        )}
      </div>
    </div>
  );
}
