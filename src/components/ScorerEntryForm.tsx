'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getMatchStatus } from '@/lib/match-status';
import { Match } from '@/data/fixtures';

interface ScorerEntryFormProps {
  matches: Match[];
  onSubmitted: () => void;
}

export default function ScorerEntryForm({ matches, onSubmitted }: ScorerEntryFormProps) {
  const { user, token } = useAuth();
  const [matchId, setMatchId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [minute, setMinute] = useState('');
  const [isPenalty, setIsPenalty] = useState(false);
  const [isOwnGoal, setIsOwnGoal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const completedMatches = matches.filter(m => getMatchStatus(m).hasScore);

  const selectedMatch = completedMatches.find(m => m.id === matchId);
  const teamOptions = selectedMatch ? [
    { id: selectedMatch.homeTeamId, name: selectedMatch.homeTeamId },
    { id: selectedMatch.awayTeamId, name: selectedMatch.awayTeamId },
  ] : [];

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId || !teamId || !playerName.trim()) {
      setError('Maç, takım ve oyuncu adı zorunlu');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/scorers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matchId, teamId, playerName: playerName.trim(), minute: minute ? parseInt(minute) : null, isPenalty, isOwnGoal }),
      });
      if (res.ok) {
        setMatchId('');
        setTeamId('');
        setPlayerName('');
        setMinute('');
        setIsPenalty(false);
        setIsOwnGoal(false);
        onSubmitted();
      } else {
        const data = await res.json();
        setError(data.error || 'Gol kaydedilemedi');
      }
    } catch {
      setError('Bağlantı hatası');
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Gol Girişi</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maç</label>
          <select value={matchId} onChange={e => { setMatchId(e.target.value); setTeamId(''); }} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Maç seçin</option>
            {completedMatches.slice(0, 20).map(m => (
              <option key={m.id} value={m.id}>
                {m.homeTeamId} {m.homeScore}-{m.awayScore} {m.awayTeamId}
              </option>
            ))}
          </select>
        </div>

        {matchId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Takım</label>
            <select value={teamId} onChange={e => setTeamId(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Takım seçin</option>
              {teamOptions.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Oyuncu Adı</label>
          <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Örn: Lionel Messi" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dakika (opsiyonel)</label>
          <input type="number" value={minute} onChange={e => setMinute(e.target.value)} placeholder="Örn: 45" min="1" max="120" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPenalty} onChange={e => setIsPenalty(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Penaltı</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isOwnGoal} onChange={e => setIsOwnGoal(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Kendi kalesine</span>
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
          {submitting ? 'Kaydediliyor...' : 'Gol Kaydet'}
        </button>
      </form>
    </div>
  );
}