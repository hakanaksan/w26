'use client';

import { useState } from 'react';
import { getTeam } from '@/data/teams';
import type { Match } from '@/data/fixtures';

interface MatchCardProps {
  match: Match;
  onScoreUpdate?: (matchId: string, homeScore: number, awayScore: number) => void;
  onNotify?: (matchId: string) => void;
}

export default function MatchCard({ match, onScoreUpdate, onNotify }: MatchCardProps) {
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? '');
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? '');
  const [isEditing, setIsEditing] = useState(false);

  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);

  const getStageStyle = (stage: string) => {
    switch (stage) {
      case 'Final': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Yarı Final': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Çeyrek Final': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Son 16': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Son 32': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleSaveScore = () => {
    if (onScoreUpdate && homeScore !== '' && awayScore !== '') {
      onScoreUpdate(match.id, Number(homeScore), Number(awayScore));
      setIsEditing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="match-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`stage-badge border ${getStageStyle(match.stage)}`}>
            {match.stage}
          </span>
        </div>
        {match.group && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            {match.group}. Grup
          </span>
        )}
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex-1 flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            {homeTeam.flag}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{homeTeam.name}</p>
          </div>
        </div>

        <div className="px-6">
          {isEditing ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={e => setHomeScore(e.target.value)}
                className="input-field w-16 text-center text-xl font-bold"
              />
              <span className="text-gray-400 text-xl">:</span>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={e => setAwayScore(e.target.value)}
                className="input-field w-16 text-center text-xl font-bold"
              />
            </div>
          ) : (
            <div className="text-center">
              {match.isCompleted || match.homeScore !== undefined ? (
                <div>
                  <p className="text-3xl font-black text-gray-900">
                    {match.homeScore} - {match.awayScore}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Maç Bitti</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-blue-600">{match.time}</p>
                  <p className="text-xs text-gray-500 mt-1">Başlangıç</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-end gap-4">
          <div className="text-right">
            <p className="font-bold text-gray-900 text-lg">{awayTeam.name}</p>
          </div>
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            {awayTeam.flag}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-500">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(match.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {match.time}
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">TR</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{match.venue}, {match.city}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {onScoreUpdate && (
          <button
            onClick={() => isEditing ? handleSaveScore() : setIsEditing(true)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
              isEditing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'btn-secondary'
            }`}
          >
            {isEditing ? '✓ Kaydet' : '✏️ Skor Gir'}
          </button>
        )}
        {onNotify && !match.isCompleted && (
          <button
            onClick={() => onNotify(match.id)}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <span>🔔</span>
            Hatırlat
          </button>
        )}
      </div>
    </div>
  );
}
