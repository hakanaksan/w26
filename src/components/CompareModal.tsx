'use client';

import { useState } from 'react';
import { teams as allTeams, getTeam, getFlagUrl } from '@/data/teams';
import { matches as allMatches } from '@/data/fixtures';

interface CompareModalProps {
  onClose: () => void;
}

export default function CompareModal({ onClose }: CompareModalProps) {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  const teamList = Object.values(allTeams).sort((a, b) => a.name.localeCompare(b.name));

  const a = teamA ? getTeam(teamA) : null;
  const b = teamB ? getTeam(teamB) : null;

  const getTeamStats = (code: string) => {
    const tm = allMatches.filter(m => (m.homeTeamId === code || m.awayTeamId === code) && (m.isCompleted || m.homeScore !== undefined));
    let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
    tm.forEach(m => {
      const isHome = m.homeTeamId === code;
      const scored = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
      const conceded = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
      gf += scored; ga += conceded;
      if (scored > conceded) wins++;
      else if (scored === conceded) draws++;
      else losses++;
    });
    const points = wins * 3 + draws;
    const groupMatches = allMatches.filter(m => m.homeTeamId === code || m.awayTeamId === code);
    return { played: tm.length, wins, draws, losses, gf, ga, gd: gf - ga, points, totalMatches: groupMatches.length, ranking: a?.ranking || 99 };
  };

  const statsA = teamA ? getTeamStats(teamA) : null;
  const statsB = teamB ? getTeamStats(teamB) : null;

  const compRows = [
    { label: 'FIFA Sıralaması', key: 'ranking', lower: true },
    { label: 'Oynanan', key: 'played' },
    { label: 'Galibiyet', key: 'wins' },
    { label: 'Beraberlik', key: 'draws' },
    { label: 'Mağlubiyet', key: 'losses' },
    { label: 'Atılan Gol', key: 'gf' },
    { label: 'Yenilen Gol', key: 'ga' },
    { label: 'Averaj', key: 'gd' },
    { label: 'Puan', key: 'points' },
    { label: 'Toplam Maç', key: 'totalMatches' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 pb-4 border-b border-gray-100 dark:border-gray-700 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Takım Karşılaştırma</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-6 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Takım 1</label>
              <select value={teamA} onChange={e => setTeamA(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm">
                <option value="">Seçin</option>
                {teamList.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Takım 2</label>
              <select value={teamB} onChange={e => setTeamB(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm">
                <option value="">Seçin</option>
                {teamList.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {a && b && statsA && statsB && (
            <div className="mt-4">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex flex-col items-center gap-2">
                  <img src={a.flag} alt={a.name} className="w-16 h-11 rounded-lg object-cover shadow-md" />
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{a.name}</span>
                </div>
                <div className="text-2xl font-black text-gray-300 dark:text-gray-600">VS</div>
                <div className="flex flex-col items-center gap-2">
                  <img src={b.flag} alt={b.name} className="w-16 h-11 rounded-lg object-cover shadow-md" />
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{b.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                {compRows.map(row => {
                  const valA = (statsA as Record<string, number>)[row.key] ?? 0;
                  const valB = (statsB as Record<string, number>)[row.key] ?? 0;
                  const aWins = row.lower ? valA < valB : valA > valB;
                  const bWins = row.lower ? valB < valA : valB > valA;
                  return (
                    <div key={row.key} className="flex items-center gap-2">
                      <span className={`w-12 text-right text-sm font-bold ${aWins ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{row.key === 'gd' && valA > 0 ? `+${valA}` : valA}</span>
                      <div className="flex-1 h-6 relative">
                        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <div className={`absolute left-0 top-0 bottom-0 ${aWins ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-200 dark:bg-gray-600'} rounded-l-lg transition-all`} style={{ width: '50%' }} />
                          <div className={`absolute right-0 top-0 bottom-0 ${bWins ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-200 dark:bg-gray-600'} rounded-r-lg transition-all`} style={{ width: '50%' }} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">{row.label}</div>
                      </div>
                      <span className={`w-12 text-left text-sm font-bold ${bWins ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{row.key === 'gd' && valB > 0 ? `+${valB}` : valB}</span>
                    </div>
                  );
                })}
              </div>

              {allMatches.some(m => (m.homeTeamId === teamA && m.awayTeamId === teamB) || (m.homeTeamId === teamB && m.awayTeamId === teamA)) && (
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">ARALARINDAKİ MAÇLAR</p>
                  {allMatches.filter(m => (m.homeTeamId === teamA && m.awayTeamId === teamB) || (m.homeTeamId === teamB && m.awayTeamId === teamA)).map(m => {
                    const ht = getTeam(m.homeTeamId);
                    const at = getTeam(m.awayTeamId);
                    return (
                      <div key={m.id} className="flex items-center justify-between text-sm py-1">
                        <span className="text-gray-700 dark:text-gray-300">{ht.name} vs {at.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">{m.date} • {m.time}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {(!a || !b) && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-2">⚖️</p>
              <p className="text-sm">Karşılaştırmak için iki takım seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}