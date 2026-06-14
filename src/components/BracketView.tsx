'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { matches as allMatches } from '@/data/fixtures';
import { getTeam, getFlagUrl } from '@/data/teams';
import { useLiveScores } from '@/hooks/useLiveScores';
import { getMatchStatus } from '@/lib/match-status';
import { resolveRealBracket, calculateGroupStandings, BracketSlot, GroupStanding } from '@/data/bracket';

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

function getRoundBadgeColors(stage: string) {
  const map: Record<string, string> = {
    'Final': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'Yarı Final': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'Çeyrek Final': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'Son 16': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    'Son 32': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    'Üçüncülük': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  };
  return map[stage] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
}

export default function BracketView() {
  const router = useRouter();
  const [localMatches, setLocalMatches] = useState(allMatches);
  const [activeRound, setActiveRound] = useState<string>('all');

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

  const bracketSlots = useMemo(() => resolveRealBracket(matches), [matches]);
  const groupStandings = useMemo(() => calculateGroupStandings(matches, {}), [matches]);

  const rounds = ['Son 32', 'Son 16', 'Çeyrek Final', 'Yarı Final', 'Üçüncülük', 'Final'];

  const completedGroupMatches = matches.filter(m => m.group && getMatchStatus(m).isCompleted).length;
  const totalGroupMatches = matches.filter(m => m.group).length;
  const completedKnockout = matches.filter(m => rounds.includes(m.stage) && getMatchStatus(m).hasScore).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const projectedChampion = useMemo(() => {
    const final = bracketSlots.find(s => s.round === 'Final');
    if (final && final.winner && final.winner !== 'TBD') return final.winner;
    return null;
  }, [bracketSlots]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-purple-200 dark:shadow-purple-900/50">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Turnuva Ağacı</h2>
          <p className="text-gray-500 dark:text-gray-400">Mevcut puan durumuna göre olası eşleşmeler</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          <span className="font-bold">Bilgi:</span> Bu görünüm, grupların şu anki gerçek puan durumuna göre olası Son 32 eşleşmelerini gösterir. Henüz oynanmamış eleme maçlarında takımlar belirlendikçe güncellenir.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">{completedGroupMatches}/{totalGroupMatches} grup maçı tamamlandı</span>
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all" style={{ width: totalGroupMatches > 0 ? `${(completedGroupMatches / totalGroupMatches) * 100}%` : '0%' }} />
            </div>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{completedKnockout} eleme maçı oynandı</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setActiveRound('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeRound === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Tümü</button>
          {rounds.map(stage => (
            <button key={stage} onClick={() => setActiveRound(stage)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeRound === stage ? 'bg-gradient-to-r ' + getStageColor(stage) + ' text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{stageLabels[stage]}</button>
          ))}
        </div>
      </div>

      {projectedChampion && (() => {
        const champ = getTeam(projectedChampion);
        return (
          <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-amber-500 dark:to-amber-600 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-4">
              <img src={champ.flag || getFlagUrl(projectedChampion)} alt={champ.name} className="w-14 h-10 rounded shadow-md" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-100">Mevcut projeksiyona göre şampiyon</p>
                <p className="text-2xl font-black text-amber-900 dark:text-white">{champ.name}</p>
              </div>
              <div className="ml-auto text-5xl">🏆</div>
            </div>
          </div>
        );
      })()}

      {Object.keys(groupStandings).length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="px-3 py-1 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm">
              Grup Sıralamaları
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Gerçek maç sonuçlarına göre</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Object.entries(groupStandings).sort(([a], [b]) => a.localeCompare(b)).map(([groupId, teams]) => {
              const groupMatches = matches.filter(m => m.group === groupId);
              const playedCount = groupMatches.filter(m => getMatchStatus(m).isCompleted).length;
              const isComplete = playedCount === 6;
              return (
                <div key={groupId} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{groupId}. Grup</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isComplete ? 'bg-emerald-200 text-emerald-800' : 'bg-white/20 text-white'}`}>{isComplete ? 'Tamamlandı' : `${playedCount}/6`}</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                        <th className="text-left py-1 px-2 w-5">#</th>
                        <th className="text-left py-1 px-2">Takım</th>
                        <th className="text-center py-1 px-1">O</th>
                        <th className="text-center py-1 px-1">G</th>
                        <th className="text-center py-1 px-1">B</th>
                        <th className="text-center py-1 px-1">M</th>
                        <th className="text-center py-1 px-1">A</th>
                        <th className="text-center py-1 px-1 font-bold">P</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team, idx) => {
                        const isQualified = idx < 2;
                        const isThirdQualified = idx === 2;
                        return (
                          <tr key={team.code} className={`border-b border-gray-50 dark:border-gray-750 last:border-0 ${isQualified ? 'bg-emerald-50 dark:bg-emerald-900/10' : isThirdQualified ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                            <td className="py-1.5 px-2">
                              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${isQualified ? 'bg-emerald-500 text-white' : isThirdQualified ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-1.5 px-2">
                              <div className="flex items-center gap-1.5">
                                <img src={team.flag || getFlagUrl(team.code)} alt={team.name} className="w-4 h-3 rounded object-cover" />
                                <span className={`font-medium truncate ${isQualified ? 'text-emerald-700 dark:text-emerald-300' : isThirdQualified ? 'text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {team.name}
                                </span>
                              </div>
                            </td>
                            <td className="text-center py-1.5 px-1 text-gray-600 dark:text-gray-400">{team.played}</td>
                            <td className="text-center py-1.5 px-1 text-emerald-600 dark:text-emerald-400 font-medium">{team.won}</td>
                            <td className="text-center py-1.5 px-1 text-gray-600 dark:text-gray-400">{team.drawn}</td>
                            <td className="text-center py-1.5 px-1 text-red-500 dark:text-red-400">{team.lost}</td>
                            <td className="text-center py-1.5 px-1 font-medium">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                            <td className="text-center py-1 px-1 font-black text-gray-900 dark:text-white">{team.pts}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-2 py-1.5 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-gray-500 dark:text-gray-400">Son 32</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-gray-500 dark:text-gray-400">3. sıra (en iyi 8)</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActiveRound('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeRound === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
          Tümü
        </button>
        {rounds.map(r => (
          <button key={r} onClick={() => setActiveRound(r)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeRound === r ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {r}
          </button>
        ))}
      </div>

      {rounds.map(round => {
        if (activeRound !== 'all' && activeRound !== round) return null;
        const roundSlots = bracketSlots.filter(s => s.round === round);
        if (roundSlots.length === 0) return null;

        return (
          <div key={round}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`px-3 py-1 rounded-lg text-sm font-bold text-white bg-gradient-to-r ${getStageColor(round)} shadow-sm`}>
                {stageLabels[round]}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{roundSlots.length} maç</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {roundSlots.map(slot => {
                const home = getTeam(slot.homeTeamId);
                const away = getTeam(slot.awayTeamId);
                const isTBD = slot.homeTeamId === 'TBD' || slot.awayTeamId === 'TBD';
                const actualMatch = matches.find(m => m.id === slot.matchId);
                const status = actualMatch ? getMatchStatus(actualMatch) : { hasScore: false, isCompleted: false, isLive: false };
                const homeWon = status.hasScore && slot.homeScore! > slot.awayScore!;
                const awayWon = status.hasScore && slot.homeScore! < slot.awayScore!;

                return (
                  <div key={slot.matchId} className={`relative bg-white dark:bg-gray-800 border rounded-xl overflow-hidden transition-all hover:shadow-md ${
                    round === 'Final' ? 'border-amber-300 dark:border-amber-600 ring-1 ring-amber-200 dark:ring-amber-800' :
                    'border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className={`h-1 bg-gradient-to-r ${getStageColor(round)}`} />

                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getRoundBadgeColors(round)}`}>
                          {slot.matchId}
                        </span>
                        {slot.isCompleted && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Bitti</span>}
                        {status.isLive && <span className="text-[10px] font-bold text-red-600 dark:text-red-400">CANLI</span>}
                      </div>

                      <div className="space-y-1.5">
                        <div className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${homeWon ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                          {slot.homeTeamId !== 'TBD' ? (
                            <img src={home.flag || getFlagUrl(slot.homeTeamId)} alt={home.name} className="w-7 h-5 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-5 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] text-gray-400">?</span>
                            </div>
                          )}
                          <span className={`text-sm font-medium flex-1 truncate ${homeWon ? 'text-emerald-700 dark:text-emerald-300 font-bold' : isTBD ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {slot.homeTeamId === 'TBD' ? 'TBD' : home.name}
                          </span>
                          {slot.homeScore !== undefined && (
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{slot.homeScore}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-center">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">vs</span>
                        </div>

                        <div className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${awayWon ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                          {slot.awayTeamId !== 'TBD' ? (
                            <img src={away.flag || getFlagUrl(slot.awayTeamId)} alt={away.name} className="w-7 h-5 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-5 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] text-gray-400">?</span>
                            </div>
                          )}
                          <span className={`text-sm font-medium flex-1 truncate ${awayWon ? 'text-emerald-700 dark:text-emerald-300 font-bold' : isTBD ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {slot.awayTeamId === 'TBD' ? 'TBD' : away.name}
                          </span>
                          {slot.awayScore !== undefined && (
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{slot.awayScore}</span>
                          )}
                        </div>
                      </div>

                      {slot.winner && slot.winner !== 'TBD' && !isTBD && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ➤ {getTeam(slot.winner).name}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">ilerliyor</span>
                        </div>
                      )}

                      {!status.hasScore && !isTBD && actualMatch && (
                        <button onClick={() => router.push(`/match/${slot.matchId}`)} className="mt-2 w-full text-xs text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-blue-200 dark:border-blue-800">
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
        );
      })}

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
