'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { matches as allMatches } from '@/data/fixtures';
import { getTeam, getFlagUrl } from '@/data/teams';
import { useLiveScores } from '@/hooks/useLiveScores';
import { getMatchStatus } from '@/lib/match-status';

type BracketRound = {
  name: string;
  matches: {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore?: number;
    awayScore?: number;
    isCompleted: boolean;
    date: string;
    time: string;
    venue: string;
  }[];
};

const stageOrder = ['Son 32', 'Son 16', 'Çeyrek Final', 'Yarı Final'];
const stageLabels: Record<string, string> = {
  'Son 32': 'Son 32',
  'Son 16': 'Son 16',
  'Çeyrek Final': 'Çeyrek Final',
  'Yarı Final': 'Yarı Final',
  'Üçüncülük': '3./4.',
  'Final': 'Final',
};

function getStageColor(stage: string) {
  switch (stage) {
    case 'Final': return 'from-amber-500 to-amber-600';
    case 'Yarı Final': return 'from-purple-500 to-purple-600';
    case 'Çeyrek Final': return 'from-blue-500 to-blue-600';
    case 'Son 16': return 'from-emerald-500 to-emerald-600';
    case 'Son 32': return 'from-cyan-500 to-cyan-600';
    case 'Üçüncülük': return 'from-orange-500 to-orange-600';
    default: return 'from-gray-500 to-gray-600';
  }
}

export default function BracketView() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [localMatches, setLocalMatches] = useState(allMatches);
  const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({});
  const [selectedRound, setSelectedRound] = useState<string>('all');

  const { mergedMatches: matches } = useLiveScores(localMatches);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch('/api/scores');
        if (res.ok) {
          const data = await res.json();
          const scores = data.scores || {};
          if (Object.keys(scores).length > 0) {
            setLocalMatches(allMatches.map(m => {
              const s = scores[m.id];
              if (s) return { ...m, homeScore: s.homeScore, awayScore: s.awayScore, isCompleted: s.isCompleted };
              return m;
            }));
          }
        }
      } catch {}
    };
    fetchScores();
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch('/api/predictions', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : { predictions: {} })
      .then(data => setPredictions(data.predictions || {}))
      .catch(() => {});
  }, [token]);

  const knockoutStages = ['Son 32', 'Son 16', 'Çeyrek Final', 'Yarı Final', 'Üçüncülük', 'Final'];

  const rounds: BracketRound[] = knockoutStages.map(stage => ({
    name: stage,
    matches: matches
      .filter(m => m.stage === stage)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .map(m => ({
        id: m.id,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        isCompleted: m.isCompleted,
        date: m.date,
        time: m.time,
        venue: m.venue,
      })),
  }));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const totalKnockoutMatches = matches.filter(m => knockoutStages.includes(m.stage)).length;
  const completedKnockout = matches.filter(m => knockoutStages.includes(m.stage) && getMatchStatus(m).hasScore).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-purple-200 dark:shadow-purple-900/50">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Turnuva Ağacı</h2>
          <p className="text-gray-500 dark:text-gray-400">Eleme turları ve sonuçları</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">{completedKnockout}/{totalKnockoutMatches} maç oynandı</span>
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all" style={{ width: totalKnockoutMatches > 0 ? `${(completedKnockout / totalKnockoutMatches) * 100}%` : '0%' }} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setSelectedRound('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedRound === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Tümü</button>
          {knockoutStages.map(stage => (
            <button key={stage} onClick={() => setSelectedRound(stage)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedRound === stage ? 'bg-gradient-to-r ' + getStageColor(stage) + ' text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{stageLabels[stage]}</button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {rounds.filter(r => selectedRound === 'all' || r.name === selectedRound).map(round => (
          <div key={round.name}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`px-3 py-1 rounded-lg text-sm font-bold text-white bg-gradient-to-r ${getStageColor(round.name)} shadow-sm`}>
                {stageLabels[round.name]}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{round.matches.length} maç</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {round.matches.map(match => {
                const home = getTeam(match.homeTeamId);
                const away = getTeam(match.awayTeamId);
                const isTBD = match.homeTeamId === 'TBD' || match.awayTeamId === 'TBD';
const { hasScore, isCompleted, isLive } = getMatchStatus(match);
const pred = predictions[match.id];
const homeWon = hasScore && match.homeScore! > match.awayScore!;
const awayWon = hasScore && match.homeScore! < match.awayScore!;

                return (
                  <div key={match.id} className={`relative bg-white dark:bg-gray-800 border rounded-xl overflow-hidden transition-all hover:shadow-md ${
                    round.name === 'Final' ? 'border-amber-300 dark:border-amber-600 ring-1 ring-amber-200 dark:ring-amber-800' :
                    round.name === 'Yarı Final' ? 'border-purple-200 dark:border-purple-700' :
                    round.name === 'Çeyrek Final' ? 'border-blue-200 dark:border-blue-800' :
                    'border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className={`h-1 bg-gradient-to-r ${getStageColor(round.name)}`} />

                    <div className="p-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-2">
                        <span>{formatDate(match.date)}</span>
                        <span>{match.time} TR</span>
                      </div>

                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 ${homeWon ? 'bg-emerald-50 dark:bg-emerald-900/20 -mx-3 px-3 py-1 rounded-lg' : ''}`}>
                          <img src={home.flag || getFlagUrl(match.homeTeamId)} alt={home.name} className="w-7 h-5 rounded object-cover flex-shrink-0" />
                          <span className={`text-sm font-medium flex-1 truncate ${homeWon ? 'text-emerald-700 dark:text-emerald-300 font-bold' : isTBD ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {home.name}
                          </span>
                          {hasScore ? (
                            <span className={`text-sm font-black tabular-nums ${homeWon ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{match.homeScore}</span>
                          ) : pred ? (
                            <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">{pred.homeScore}</span>
                          ) : null}
                        </div>

                        <div className={`flex items-center gap-2 ${awayWon ? 'bg-emerald-50 dark:bg-emerald-900/20 -mx-3 px-3 py-1 rounded-lg' : ''}`}>
                          <img src={away.flag || getFlagUrl(match.awayTeamId)} alt={away.name} className="w-7 h-5 rounded object-cover flex-shrink-0" />
                          <span className={`text-sm font-medium flex-1 truncate ${awayWon ? 'text-emerald-700 dark:text-emerald-300 font-bold' : isTBD ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {away.name}
                          </span>
                          {hasScore ? (
                            <span className={`text-sm font-black tabular-nums ${awayWon ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{match.awayScore}</span>
                          ) : pred ? (
                            <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">{pred.awayScore}</span>
                          ) : null}
                        </div>
                      </div>

                      {hasScore && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          {isCompleted ? (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Maç Bitti</span>
                          ) : isLive ? (
                            <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">CANLI</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Skor girildi</span>
                          )}
                        </div>
                      )}

                      {!hasScore && !isTBD && (
                        <button onClick={() => router.push(`/match/${match.id}`)} className="mt-2 w-full text-xs text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          Detay →
                        </button>
                      )}

                      {isTBD && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Takımlar belirlenecek</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-black">Final</h3>
            <p className="text-amber-100 text-sm">{formatDate('2026-07-20')} • 01:00 TR • MetLife Stadium, New York</p>
          </div>
        </div>
      </div>
    </div>
  );
}