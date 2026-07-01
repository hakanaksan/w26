'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface League {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  createdAt: string;
}

interface LeagueMember {
  id: string;
  userId: string;
  name: string;
  joinedAt: string;
  points?: number;
  exact?: number;
  outcome?: number;
  goalCount?: number;
  totalPredictions?: number;
}

export default function LeaguesView() {
  const { user, token } = useAuth();
  const [myLeagues, setMyLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [error, setError] = useState('');

  const fetchLeagues = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leagues?userId=${user.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      setMyLeagues(data.leagues || []);
    } catch {}
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !leagueName.trim()) return;
    try {
      const res = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: leagueName.trim(), userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setLeagueName('');
        setShowCreate(false);
        fetchLeagues();
      } else {
        setError(data.error || 'Lig oluşturulamadı');
      }
    } catch {
      setError('Bağlantı hatası');
    }
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    try {
      const res = await fetch('/api/leagues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase(), userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setJoinCode('');
        setShowJoin(false);
        fetchLeagues();
      } else {
        setError(data.error || 'Lige katılınamadı');
      }
    } catch {
      setError('Bağlantı hatası');
    }
  };

  const handleLeagueClick = async (league: League) => {
    setSelectedLeague(league);
    try {
      // Fetch scores
      const scoresRes = await fetch('/api/scores');
      const scoresData = scoresRes.ok ? await scoresRes.json() : { scores: {} };
      const scores = scoresData.scores || {};

      const res = await fetch(`/api/leagues?code=${league.code}`);
      const data = await res.json();
      if (data.members) {
        const membersWithData = await Promise.all((data.members as LeagueMember[]).map(async (m) => {
          try {
            const predRes = await fetch(`/api/predictions?userId=${m.userId}`);
            const predData = predRes.ok ? await predRes.json() : { predictions: {} };
            const predictions = predData.predictions || {};
            const totalPredictions = Object.keys(predictions).length;
            
            let exact = 0, outcome = 0, goalCount = 0, extraPenaltyPoints = 0;
            Object.entries(predictions).forEach(([matchId, pred]: [string, any]) => {
              const score = scores[matchId];
              if (!score || !score.isCompleted) return;

              const isKnockout = matchId >= 'M073';
              const isRegularExact = pred.homeScore === score.homeScore && pred.awayScore === score.awayScore;
              const isExact = isKnockout && score.homeScore === score.awayScore
                ? isRegularExact && pred.homePenaltyScore !== undefined && score.homePenaltyScore !== undefined && pred.homePenaltyScore === score.homePenaltyScore && pred.awayPenaltyScore === score.awayPenaltyScore
                : isRegularExact;

              if (isExact) {
                exact++;
              } else {
                const predWinner = pred.homeScore > pred.awayScore ? 'home' : (pred.homeScore < pred.awayScore ? 'away' : (pred.homePenaltyScore !== undefined && pred.awayPenaltyScore !== undefined && pred.homePenaltyScore > pred.awayPenaltyScore ? 'home' : 'away'));
                const actualWinner = score.homeScore > score.awayScore ? 'home' : (score.homeScore < score.awayScore ? 'away' : (score.homePenaltyScore !== undefined && score.awayPenaltyScore !== undefined && score.homePenaltyScore > score.awayPenaltyScore ? 'home' : 'away'));

                if (isKnockout) {
                  if (predWinner === actualWinner) {
                    outcome++;
                  } else if (pred.homeScore === score.homeScore || pred.awayScore === score.awayScore) {
                    goalCount++;
                  }
                } else {
                  const predOutcome = pred.homeScore > pred.awayScore ? 'home' : (pred.homeScore < pred.awayScore ? 'away' : 'draw');
                  const actualOutcome = score.homeScore > score.awayScore ? 'home' : (score.homeScore < score.awayScore ? 'away' : 'draw');
                  if (predOutcome === actualOutcome) {
                    outcome++;
                  } else if (pred.homeScore === score.homeScore || pred.awayScore === score.awayScore) {
                    goalCount++;
                  }
                }
              }

              // Extra penalty points
              if (isKnockout && score.homeScore === score.awayScore) {
                const predWinner = pred.homeScore > pred.awayScore ? 'home' : (pred.homeScore < pred.awayScore ? 'away' : (pred.homePenaltyScore !== undefined && pred.awayPenaltyScore !== undefined && pred.homePenaltyScore > pred.awayPenaltyScore ? 'home' : 'away'));
                const actualWinner = score.homeScore > score.awayScore ? 'home' : (score.homeScore < score.awayScore ? 'away' : (score.homePenaltyScore !== undefined && score.awayPenaltyScore !== undefined && score.homePenaltyScore > score.awayPenaltyScore ? 'home' : 'away'));
                if (predWinner === actualWinner) {
                  extraPenaltyPoints += 3;
                }
              }
            });

            const points = exact * 3 + outcome * 2 + goalCount + extraPenaltyPoints;
            return { ...m, points, exact, outcome, goalCount, totalPredictions };
          } catch {
            return { ...m, points: 0, exact: 0, outcome: 0, goalCount: 0, totalPredictions: 0 };
          }
        }));
        setMembers(membersWithData.sort((a, b) => (b.points || 0) - (a.points || 0)));
      }
    } catch {}
  };

  const handleLeave = async (leagueId: string) => {
    if (!user) return;
    try {
      await fetch('/api/leagues', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId, userId: user.id }),
      });
      setSelectedLeague(null);
      fetchLeagues();
    } catch {}
  };

  if (!user) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">
          <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4m14 0h-4m2 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7m4 10v2m6-2v2M9 14h6" /></svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Giriş Yapın</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Lig oluşturmak veya katılmak için giriş yapmanız gerekiyor</p>
        <a href="/auth/login" className="btn-primary inline-block px-8 py-3">Giriş Yap</a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-2xl">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Tahmin Ligleri</h2>
            <p className="text-gray-500 dark:text-gray-400">Arkadaşlarınızla yarışın</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }} className="btn-primary px-4 py-2 text-sm">+ Oluştur</button>
          <button onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); fetchLeagues(); }} className="btn-secondary px-4 py-2 text-sm">Katıl</button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Yeni Lig Oluştur</h3>
          <div className="flex gap-3">
            <input type="text" value={leagueName} onChange={e => setLeagueName(e.target.value)} placeholder="Lig adı (örn: Ofis Ligi)" className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm" />
            <button onClick={handleCreate} className="btn-primary px-6 py-2.5 text-sm">Oluştur</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium">İptal</button>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      )}

      {showJoin && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Lige Katıl</h3>
          <div className="flex gap-3">
            <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Lig kodu (örn: ABC123)" maxLength={6} className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm uppercase tracking-widest text-center font-mono" />
            <button onClick={handleJoin} className="btn-primary px-6 py-2.5 text-sm">Katıl</button>
            <button onClick={() => setShowJoin(false)} className="px-4 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium">İptal</button>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      )}

      {selectedLeague ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{selectedLeague.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Kod: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{selectedLeague.code}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleLeave(selectedLeague.id)} className="text-xs text-red-500 hover:text-red-700 underline">Ligten Çık</button>
              <button onClick={() => setSelectedLeague(null)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">← Geri</button>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                <th className="text-left py-3 px-4">#</th>
                <th className="text-left py-3 px-4">Kullanıcı</th>
                <th className="text-center py-3 px-2">Tahmin</th>
                <th className="text-center py-3 px-4">Puan</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400 dark:text-gray-500">Üye bulunamadı</td></tr>
              ) : members.map((m, i) => (
                <tr key={m.id} className={`border-b border-gray-100 dark:border-gray-700 ${i < 3 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                  <td className="py-3 px-4">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : i === 1 ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200' : i === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{i + 1}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{m.name || 'Bilinmeyen'}</td>
                  <td className="text-center py-3 px-2 text-gray-600 dark:text-gray-300">{m.totalPredictions || 0}</td>
                  <td className="text-center py-3 px-4 text-lg font-black text-blue-600 dark:text-blue-400">{m.points || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <button onClick={fetchLeagues} className="mb-4 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
            {myLeagues.length > 0 ? 'Liglerimi Yenile' : 'Liglerimi Getir'}
          </button>
          {myLeagues.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">
                <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 14.82 14.82 0 003.2-3.367A14.82 14.82 0 0019.5 7.983c-1.962 0-3.78.64-5.256 1.722A9.094 9.094 0 0012 18.72z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz lig yok</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Bir lig oluşturun veya arkadaşlarınızın koduyla katılın</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLeagues.map(league => (
                <button key={league.id} onClick={() => handleLeagueClick(league)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{league.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Kod: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{league.code}</span></p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}