'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { matches as allMatches, Match } from '@/data/fixtures';
import { getTeam, getFlagUrl } from '@/data/teams';
import { resolveBracket, calculateGroupStandings, BracketSlot, GroupStanding } from '@/data/bracket';
import { useLiveScores } from '@/hooks/useLiveScores';

export default function BracketPredictor() {
  const { user, token } = useAuth();
  const [localMatches, setLocalMatches] = useState(allMatches);
  const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({});
  const [bracketSlots, setBracketSlots] = useState<BracketSlot[]>([]);
  const [groupStandings, setGroupStandings] = useState<Record<string, GroupStanding[]>>({});
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [homePred, setHomePred] = useState('');
  const [awayPred, setAwayPred] = useState('');
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

  useEffect(() => {
    if (!token) return;
    fetch('/api/predictions', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : { predictions: {} })
      .then(data => setPredictions(data.predictions || {}))
      .catch(() => {});
  }, [token]);

  const recalc = useCallback((matchData: Match[], preds: Record<string, { homeScore: number; awayScore: number }>) => {
    setBracketSlots(resolveBracket(matchData, preds));
    setGroupStandings(calculateGroupStandings(matchData, preds));
  }, []);

  useEffect(() => {
    recalc(matches, predictions);
  }, [matches, predictions, recalc]);

  const handlePredict = async (matchId: string) => {
    const h = parseInt(homePred);
    const a = parseInt(awayPred);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;

    const newPred = { homeScore: h, awayScore: a };
    const newPredictions = { ...predictions, [matchId]: newPred };
    setPredictions(newPredictions);
    setEditingMatch(null);
    setHomePred('');
    setAwayPred('');

    if (token) {
      try {
        await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ matchId, homeScore: h, awayScore: a }),
        });
      } catch {}
    }

    recalc(matches, newPredictions);
  };

  const handleDelete = async (matchId: string) => {
    const newPredictions = { ...predictions };
    delete newPredictions[matchId];
    setPredictions(newPredictions);

    if (token) {
      try {
        await fetch('/api/predictions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ matchId }),
        });
      } catch {}
    }

    recalc(matches, newPredictions);
  };

  const rounds = ['Son 32', 'Son 16', 'Çeyrek Final', 'Yarı Final', 'Üçüncülük', 'Final'];

  const roundColors: Record<string, string> = {
    'Final': 'from-amber-500 to-amber-600',
    'Yarı Final': 'from-purple-500 to-purple-600',
    'Çeyrek Final': 'from-blue-500 to-blue-600',
    'Son 16': 'from-emerald-500 to-emerald-600',
    'Son 32': 'from-cyan-500 to-cyan-600',
    'Üçüncülük': 'from-orange-500 to-orange-600',
  };

  const roundBadgeColors: Record<string, string> = {
    'Final': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'Yarı Final': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'Çeyrek Final': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'Son 16': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    'Son 32': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    'Üçüncülük': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  };

  let predictedChampion = '';
  const finalSlot = bracketSlots.find(s => s.round === 'Final');
  if (finalSlot && finalSlot.winner && finalSlot.winner !== 'TBD') {
    predictedChampion = finalSlot.winner;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200/50 dark:shadow-purple-900/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Tahmin Turnuvası</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Grup tahminlerine göre takımları ilerlet, eleme skorlarını gir</p>
          </div>
        </div>
      </div>

      {!user && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-center">
          <p className="text-blue-700 dark:text-blue-300 font-medium">Tahmin girmek için <a href="/auth/login" className="underline font-bold">giriş yapın</a></p>
        </div>
      )}

      {/* Champion banner */}
      {predictedChampion && (() => {
        const champ = getTeam(predictedChampion);
        return (
          <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-amber-500 dark:to-amber-600 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-4">
              <img src={champ.flag || getFlagUrl(predictedChampion)} alt={champ.name} className="w-14 h-10 rounded shadow-md" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-100">Tahmin edilen şampiyon</p>
                <p className="text-2xl font-black text-amber-900 dark:text-white">{champ.name}</p>
              </div>
              <div className="ml-auto text-5xl">🏆</div>
            </div>
          </div>
        );
      })()}

      {/* Predicted group standings */}
      {Object.keys(groupStandings).length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="px-3 py-1 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-sm">
              Grup Sıralaması
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Tahminlere göre oluşan puan cetveli</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Object.entries(groupStandings).sort(([a], [b]) => a.localeCompare(b)).map(([groupId, teams]) => {
              const hasAnyPrediction = Object.keys(predictions).some(id => {
                const m = allMatches.find(x => x.id === id);
                return m && m.group === groupId;
              });
              return (
                <div key={groupId} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{groupId}. Grup</span>
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
                        <th className="text-center py-1 px-1">AG</th>
                        <th className="text-center py-1 px-1">YG</th>
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
                            <td className="text-center py-1.5 px-1 text-gray-700 dark:text-gray-300">{team.gf}</td>
                            <td className="text-center py-1.5 px-1 text-gray-700 dark:text-gray-300">{team.ga}</td>
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

      {/* Round filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActiveRound('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeRound === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
          Tumu
        </button>
        {rounds.map(r => (
          <button key={r} onClick={() => setActiveRound(r)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeRound === r ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {r}
          </button>
        ))}
      </div>

      {/* Round cards */}
      {rounds.map(round => {
        if (activeRound !== 'all' && activeRound !== round) return null;
        const roundSlots = bracketSlots.filter(s => s.round === round);
        if (roundSlots.length === 0) return null;

        return (
          <div key={round}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`px-3 py-1 rounded-lg text-sm font-bold text-white bg-gradient-to-r ${roundColors[round]} shadow-sm`}>
                {round}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{roundSlots.length} maç</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {roundSlots.map(slot => {
                const home = getTeam(slot.homeTeamId);
                const away = getTeam(slot.awayTeamId);
                const isTBD = slot.homeTeamId === 'TBD' || slot.awayTeamId === 'TBD';
                const pred = predictions[slot.matchId];
                const isEditing = editingMatch === slot.matchId;

                const isHomeWin = (slot.homeScore ?? (pred?.homeScore)) !== undefined && (slot.homeScore ?? pred!.homeScore) > (slot.awayScore ?? pred!.awayScore);
                const isAwayWin = (slot.homeScore ?? (pred?.homeScore)) !== undefined && (slot.homeScore ?? pred!.homeScore) < (slot.awayScore ?? pred!.awayScore);
                const isDraw = (slot.homeScore ?? (pred?.homeScore)) !== undefined && (slot.homeScore ?? pred!.homeScore) === (slot.awayScore ?? pred!.awayScore);

                return (
                  <div key={slot.matchId} className={`relative bg-white dark:bg-gray-800 border rounded-xl overflow-hidden transition-all ${
                    round === 'Final' ? 'border-amber-300 dark:border-amber-600 ring-1 ring-amber-200 dark:ring-amber-800' :
                    'border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className={`h-1 bg-gradient-to-r ${roundColors[round]}`} />

                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roundBadgeColors[round]}`}>
                          {slot.matchId}
                        </span>
                        {slot.isCompleted && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Bitti</span>}
                      </div>

                      <div className="space-y-1.5">
                        <div className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${isHomeWin ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                          {slot.homeTeamId !== 'TBD' ? (
                            <img src={home.flag || getFlagUrl(slot.homeTeamId)} alt={home.name} className="w-7 h-5 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-5 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] text-gray-400">?</span>
                            </div>
                          )}
                          <span className={`text-sm font-medium flex-1 truncate ${isTBD ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {slot.homeTeamId === 'TBD' ? 'TBD' : home.name}
                          </span>
                          {slot.homeScore !== undefined && (
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{slot.homeScore}</span>
                          )}
                          {pred && slot.homeScore === undefined && (
                            <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">{pred.homeScore}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-center">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">vs</span>
                        </div>

                        <div className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${isAwayWin ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                          {slot.awayTeamId !== 'TBD' ? (
                            <img src={away.flag || getFlagUrl(slot.awayTeamId)} alt={away.name} className="w-7 h-5 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-5 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] text-gray-400">?</span>
                            </div>
                          )}
                          <span className={`text-sm font-medium flex-1 truncate ${isTBD ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {slot.awayTeamId === 'TBD' ? 'TBD' : away.name}
                          </span>
                          {slot.awayScore !== undefined && (
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{slot.awayScore}</span>
                          )}
                          {pred && slot.awayScore === undefined && (
                            <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">{pred.awayScore}</span>
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

                      {user && !isTBD && !slot.isCompleted && !isEditing && !pred && (
                        <button onClick={() => { setEditingMatch(slot.matchId); setHomePred(''); setAwayPred(''); }}
                          className="mt-2 w-full text-xs text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-blue-200 dark:border-blue-800">
                          Tahmin Gir →
                        </button>
                      )}

                      {isEditing && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-900 dark:text-white w-8 truncate">{(slot.homeTeamId === 'TBD' ? 'TBD' : home.name.substring(0, 3))}</span>
                            <input type="number" min="0" max="99" value={homePred} onChange={e => setHomePred(e.target.value)} className="w-12 text-center text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0" />
                            <span className="text-gray-400 text-xs">-</span>
                            <input type="number" min="0" max="99" value={awayPred} onChange={e => setAwayPred(e.target.value)} className="w-12 text-center text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0" />
                            <span className="text-xs font-medium text-gray-900 dark:text-white w-8 truncate text-right">{(slot.awayTeamId === 'TBD' ? 'TBD' : away.name.substring(0, 3))}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => handlePredict(slot.matchId)} className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">Kaydet</button>
                            <button onClick={() => setEditingMatch(null)} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">İptal</button>
                          </div>
                        </div>
                      )}

                      {pred && !slot.isCompleted && !isEditing && (
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {isHomeWin && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">{home.name.substring(0, 3)} ✓</span>}
                            {isAwayWin && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">{away.name.substring(0, 3)} ✓</span>}
                            {isDraw && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">Berabere</span>}
                          </div>
                          <button onClick={() => handleDelete(slot.matchId)} className="text-[10px] text-red-400 hover:text-red-600 underline">Sil</button>
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
    </div>
  );
}