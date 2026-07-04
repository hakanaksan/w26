'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import { matches as allMatches } from '@/data/fixtures';
import { getTeam, getFlagUrl } from '@/data/teams';
import { useLiveScores } from '@/hooks/useLiveScores';
import { resolveRealBracket } from '@/data/bracket';

export default function MatchDetailPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [localMatches, setLocalMatches] = useState(allMatches);
  const resolvedLocalMatches = useMemo(() => {
    const resolvedBracketSlots = resolveRealBracket(localMatches);
    return localMatches.map(m => {
      if (m.stage !== 'Grup') {
        const slot = resolvedBracketSlots.find(s => s.matchId === m.id);
        if (slot) {
          return {
            ...m,
            homeTeamId: slot.homeTeamId !== 'TBD' ? slot.homeTeamId : m.homeTeamId,
            awayTeamId: slot.awayTeamId !== 'TBD' ? slot.awayTeamId : m.awayTeamId,
          };
        }
      }
      return m;
    });
  }, [localMatches]);

  const match = resolvedLocalMatches.find(m => m.id === matchId);
  const [prediction, setPrediction] = useState<{ homeScore: number; awayScore: number; homePenaltyScore?: number; awayPenaltyScore?: number } | null>(null);
  const [isEditingPred, setIsEditingPred] = useState(false);
  const [homePred, setHomePred] = useState('');
  const [awayPred, setAwayPred] = useState('');
  const [homePenPred, setHomePenPred] = useState('');
  const [awayPenPred, setAwayPenPred] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [matchEvents, setMatchEvents] = useState<{ id: string; teamId: string; playerName: string; minute: number | null; isPenalty: boolean; isOwnGoal: boolean; eventType: 'goal' | 'yellowCard' | 'redCard' }[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventPlayer, setEventPlayer] = useState('');
  const [eventMinute, setEventMinute] = useState('');
  const [eventTeam, setEventTeam] = useState('');
  const [eventIsPenalty, setEventIsPenalty] = useState(false);
  const [eventIsOwnGoal, setEventIsOwnGoal] = useState(false);
  const savedGoalKeys = useRef(new Set<string>());

  const [userPredictions, setUserPredictions] = useState<{ userId: string; userName: string; homeScore: number; awayScore: number; homePenaltyScore?: number; awayPenaltyScore?: number; points: number; hasPoints: boolean }[]>([]);

  const loadUserPredictions = async () => {
    try {
      const res = await fetch(`/api/predictions?matchId=${matchId}&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUserPredictions(data.predictions || []);
      }
    } catch {}
  };

  const { mergedMatches: matches, liveMatches, refresh: refreshLiveScores, isLoading: liveLoading, isApiConfigured } = useLiveScores(resolvedLocalMatches);
  const liveMatch = matches.find(m => m.id === matchId);

  const liveApiData = liveMatches.find((m: any) => {
    const localM = allMatches.find(l => l.id === matchId);
    if (!localM) return false;
    return m.date === localM.date && m.homeCode === localM.homeTeamId && m.awayCode === localM.awayTeamId;
  });
  const liveMinute = liveApiData?.minute ?? null;

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/scores?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const scores: Record<string, { homeScore: number; awayScore: number; homePenaltyScore?: number; awayPenaltyScore?: number; isCompleted: boolean }> = data.scores || {};
          setLocalMatches(allMatches.map(m => {
            const s = scores[m.id];
            if (s) return { ...m, homeScore: s.homeScore, awayScore: s.awayScore, homePenaltyScore: s.homePenaltyScore, awayPenaltyScore: s.awayPenaltyScore, isCompleted: s.isCompleted };
            return m;
          }));
        }
      } catch {}
      await refreshLiveScores(match?.date);
      loadUserPredictions();
    };
    loadData();
  }, [matchId, match?.date, refreshLiveScores]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/predictions?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(res => res.ok ? res.json() : { predictions: {} })
      .then(data => {
        const p = data.predictions?.[matchId];
        if (p) {
          setPrediction(p);
          setHomePred(String(p.homeScore));
          setAwayPred(String(p.awayScore));
          setHomePenPred(p.homePenaltyScore !== undefined && p.homePenaltyScore !== null ? String(p.homePenaltyScore) : '');
          setAwayPenPred(p.awayPenaltyScore !== undefined && p.awayPenaltyScore !== null ? String(p.awayPenaltyScore) : '');
        }
      })
      .catch(() => {});

    fetch(`/api/favorites?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(res => res.ok ? res.json() : { favorites: [] })
      .then(data => setIsFavorite((data.favorites || []).includes(matchId)))
      .catch(() => {});
  }, [token, matchId]);

  useEffect(() => {
    const liveApiMatch = liveMatches.find((m: any) => {
      const localM = allMatches.find(l => l.id === matchId);
      if (!localM) return false;
      return m.date === localM.date && m.homeCode === localM.homeTeamId && m.awayCode === localM.awayTeamId;
    });
    if (!liveApiMatch || !liveApiMatch.goals || liveApiMatch.goals.length === 0) return;

    liveApiMatch.goals.forEach((goal: any) => {
      const goalSig = `${goal.teamCode}|${goal.playerName}|${goal.minute}`;
      if (savedGoalKeys.current.has(goalSig)) return;
      savedGoalKeys.current.add(goalSig);

      const eventType: 'goal' | 'yellowCard' | 'redCard' = goal.isYellowCard ? 'yellowCard' : (goal.isRedCard ? 'redCard' : 'goal');

      setMatchEvents(prev => {
        const existingSigs = new Set(prev.map(e => `${e.teamId}|${e.playerName}|${e.minute}`));
        if (existingSigs.has(goalSig)) return prev;
        return [...prev, {
          id: `live_${goalSig}`,
          teamId: goal.teamCode,
          playerName: goal.playerName,
          minute: goal.minute,
          isPenalty: goal.isPenalty,
          isOwnGoal: goal.isOwnGoal,
          eventType,
        }];
      });

      if (eventType === 'goal') {
        fetch('/api/scorers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId,
            teamId: goal.teamCode,
            playerName: goal.playerName,
            minute: goal.minute,
            isPenalty: goal.isPenalty,
            isOwnGoal: goal.isOwnGoal,
          }),
        }).catch(() => {});
      }
    });
  }, [liveMatches, matchId]);

  useEffect(() => {
    fetch(`/api/scorers?t=${Date.now()}`, { cache: 'no-store' }).then(res => res.ok ? res.json() : { scorers: [] })
      .then(data => {
        const dbEvents = (data.scorers || []).filter((s: any) => s.matchId === matchId).map((s: any) => ({ ...s, eventType: 'goal' as const }));
        setMatchEvents(prev => {
          const eventSig = (e: any) => `${e.teamId}|${e.playerName}|${e.minute}`;
          const existingSigs = new Set(prev.map(eventSig));
          const newEvents = dbEvents.filter((e: any) => !existingSigs.has(eventSig(e)));
          return [...prev, ...newEvents];
        });
      })
      .catch(() => {});
  }, [matchId]);

  useEffect(() => {
    if (!isCompleted) return;
    fetch(`/api/scorers?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : { scorers: [] }).then(data => {
      const events = (data.scorers || []).filter((s: { matchId: string }) => s.matchId === matchId);
      setMatchEvents(events);
    }).catch(() => {});
  }, [matchId, localMatches]);

  if (!match) {
    return (
      <div className="min-h-screen bg-transparent">
        <Header activeTab="fixtures" onTabChange={(tab) => router.push(`/?tab=${tab}`)} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">Maç bulunamadı.</p>
          <button onClick={() => router.push('/')} className="btn-primary mt-4">Ana Sayfaya Dön</button>
        </div>
      </div>
    );
  }

  const currentMatch = liveMatch || match;
  const homeTeam = getTeam(currentMatch.homeTeamId);
  const awayTeam = getTeam(currentMatch.awayTeamId);
  const hasScore = currentMatch.homeScore !== undefined && currentMatch.awayScore !== undefined;
  const isCompleted = currentMatch.isCompleted === true;
  const isLive = !isCompleted && hasScore;

  const handlePredict = async () => {
    const h = parseInt(homePred);
    const a = parseInt(awayPred);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;

    let hPen: number | undefined;
    let aPen: number | undefined;
    if (h === a && match.stage !== 'Grup') {
      hPen = parseInt(homePenPred);
      aPen = parseInt(awayPenPred);
      if (isNaN(hPen) || isNaN(aPen) || hPen < 0 || aPen < 0 || hPen === aPen) {
        alert('Penaltılarda kazananı belirlemek için farklı skorlar girmelisiniz.');
        return;
      }
    }

    setPrediction({ homeScore: h, awayScore: a, homePenaltyScore: hPen, awayPenaltyScore: aPen });
    setIsEditingPred(false);
    if (token) {
      try {
        await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ matchId, homeScore: h, awayScore: a, homePenaltyScore: hPen, awayPenaltyScore: aPen })
        });
        loadUserPredictions();
      } catch {}
    }
  };

  const handleDeletePrediction = async () => {
    setPrediction(null);
    setHomePred('');
    setAwayPred('');
    setHomePenPred('');
    setAwayPenPred('');
    if (token) {
      try {
        await fetch('/api/predictions', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ matchId }) });
        loadUserPredictions();
      } catch {}
    }
  };

  const toggleFavorite = async () => {
    if (!token) { router.push('/auth/login'); return; }
    if (isFavorite) {
      setIsFavorite(false);
      try { await fetch('/api/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ matchId }) }); } catch {}
    } else {
      setIsFavorite(true);
      try { await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ matchId }) }); } catch {}
    }
  };

  const getStageStyle = (stage: string) => {
    switch (stage) {
      case 'Final': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Yarı Final': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'Çeyrek Final': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'Son 16': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Son 32': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
      case 'Üçüncülük': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleAddEvent = async () => {
    if (!eventTeam || !eventPlayer.trim()) return;
    try {
      const res = await fetch('/api/scorers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ matchId, teamId: eventTeam, playerName: eventPlayer.trim(), minute: eventMinute ? parseInt(eventMinute) : null, isPenalty: eventIsPenalty, isOwnGoal: eventIsOwnGoal }),
      });
      if (res.ok) {
        setShowEventForm(false);
        setEventPlayer('');
        setEventMinute('');
        setEventTeam('');
        setEventIsPenalty(false);
        setEventIsOwnGoal(false);
        const data = await (await fetch(`/api/scorers?t=${Date.now()}`, { cache: 'no-store' })).json();
        const events = (data.scorers || []).filter((s: { matchId: string }) => s.matchId === matchId);
        setMatchEvents(events);
      }
    } catch {}
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await fetch('/api/scorers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: eventId }) });
      setMatchEvents(prev => prev.filter(e => e.id !== eventId));
    } catch {}
  };

  const [scoreHome, setScoreHome] = useState('');
  const [scoreAway, setScoreAway] = useState('');
  const [scoreHomePen, setScoreHomePen] = useState('');
  const [scoreAwayPen, setScoreAwayPen] = useState('');
  const [scoreCompleted, setScoreCompleted] = useState(true);
  const [isEditingScore, setIsEditingScore] = useState(false);

  const handleSaveScore = async () => {
    const h = parseInt(scoreHome);
    const a = parseInt(scoreAway);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;

    let hPen: number | undefined;
    let aPen: number | undefined;
    if (h === a && match.stage !== 'Grup') {
      hPen = parseInt(scoreHomePen);
      aPen = parseInt(scoreAwayPen);
      if (isNaN(hPen) || isNaN(aPen) || hPen < 0 || aPen < 0 || hPen === aPen) {
        alert('Penaltılarda kazananı belirlemek için farklı skorlar girmelisiniz.');
        return;
      }
    }

    setLocalMatches(prev => prev.map(m => m.id === matchId ? { ...m, homeScore: h, awayScore: a, homePenaltyScore: hPen, awayPenaltyScore: aPen, isCompleted: scoreCompleted } : m));
    setIsEditingScore(false);
    setScoreHome('');
    setScoreAway('');
    setScoreHomePen('');
    setScoreAwayPen('');
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, homeScore: h, awayScore: a, homePenaltyScore: hPen, awayPenaltyScore: aPen, isCompleted: scoreCompleted }),
      });
      loadUserPredictions();
    } catch {}
  };

  const handleClearScore = async () => {
    setLocalMatches(prev => prev.map(m => m.id === matchId ? { ...m, homeScore: undefined, awayScore: undefined, homePenaltyScore: undefined, awayPenaltyScore: undefined, isCompleted: false } : m));
    try {
      await fetch('/api/scores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      loadUserPredictions();
    } catch {}
  };

  const sameDayMatches = allMatches.filter(m => m.date === match.date && m.id !== match.id);

  return (
    <div className="min-h-screen bg-transparent transition-colors">
      <Header activeTab="fixtures" onTabChange={(tab) => router.push(`/?tab=${tab}`)} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Geri
        </button>

        {isApiConfigured && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => refreshLiveScores(match?.date)}
              disabled={liveLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30"
            >
              {liveLoading ? (
                <span className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
              Skorları Güncelle
            </button>
          </div>
        )}

        <div className="match-card">
          <div className="flex items-center justify-between mb-4">
            <span className={`stage-badge border ${getStageStyle(match.stage)}`}>{match.stage}</span>
            <div className="flex items-center gap-3">
              {match.group && <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{match.group}. Grup</span>}
              <button onClick={toggleFavorite} className={`text-xl transition-all ${isFavorite ? 'text-yellow-500 scale-110' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`}>
                {isFavorite ? '⭐' : '☆'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 py-8">
            <div className="flex flex-col items-center gap-3 min-w-[120px]">
              <a href={`/team/${match.homeTeamId}`}>
                <img src={homeTeam.flag || getFlagUrl(match.homeTeamId)} alt={homeTeam.name} className="w-20 h-14 rounded-xl shadow-inner object-cover hover:opacity-80 transition-opacity cursor-pointer" />
              </a>
              <a href={`/team/${match.homeTeamId}`} className="font-bold text-gray-900 dark:text-white text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{homeTeam.name}</a>
            </div>

            <div className="text-center px-4">
              {hasScore ? (
                <div>
                  <p className="text-5xl font-black text-gray-900 dark:text-white">
                    {currentMatch.homeScore} - {currentMatch.awayScore}
                  </p>
                  {currentMatch.homeScore === currentMatch.awayScore && currentMatch.homePenaltyScore !== undefined && currentMatch.awayPenaltyScore !== undefined && (
                    <p className="text-lg font-bold text-gray-500 dark:text-gray-400 mt-1">
                      (Pen: {currentMatch.homePenaltyScore} - {currentMatch.awayPenaltyScore})
                    </p>
                  )}
                  {isCompleted ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-2">Maç Bitti</p>
                  ) : isLive ? (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <p className="text-sm text-red-600 dark:text-red-400 font-bold">CANLI</p>
                      {liveMinute && <span className="text-sm text-red-500 dark:text-red-300 font-medium">{liveMinute}'</span>}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Skor girildi</p>
                  )}
                  {user && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <button onClick={() => { setScoreHome(String(currentMatch.homeScore ?? '')); setScoreAway(String(currentMatch.awayScore ?? '')); setIsEditingScore(true); }} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        Skoru Düzenle
                      </button>
                      <button onClick={handleClearScore} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                        Skoru Sil
                      </button>
                    </div>
                  )}
                </div>
              ) : isEditingScore ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">{homeTeam.name.substring(0, 3)}</span>
                    <input type="number" min="0" max="99" value={scoreHome} onChange={e => setScoreHome(e.target.value)} className="w-14 text-center text-xl font-bold bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0" />
                    <span className="text-xl font-bold text-gray-400">-</span>
                    <input type="number" min="0" max="99" value={scoreAway} onChange={e => setScoreAway(e.target.value)} className="w-14 text-center text-xl font-bold bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="0" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-12">{awayTeam.name.substring(0, 3)}</span>
                  </div>
                  {scoreHome !== '' && scoreAway !== '' && parseInt(scoreHome) === parseInt(scoreAway) && match.stage !== 'Grup' && (
                    <div className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl max-w-[200px] mx-auto">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Penaltı Atışları</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max="99" value={scoreHomePen} onChange={e => setScoreHomePen(e.target.value)} className="w-12 text-center text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-1" placeholder="P" />
                        <span className="text-sm font-bold text-gray-400">-</span>
                        <input type="number" min="0" max="99" value={scoreAwayPen} onChange={e => setScoreAwayPen(e.target.value)} className="w-12 text-center text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-1" placeholder="P" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={handleSaveScore} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Kaydet</button>
                    <button onClick={() => { setIsEditingScore(false); setScoreHome(''); setScoreAway(''); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">İptal</button>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <input type="checkbox" checked={scoreCompleted} onChange={e => setScoreCompleted(e.target.checked)} className="rounded" />
                      Maç bitti olarak işaretle
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{match.time}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Başlangıç
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium ml-1">TR</span>
                  </p>
                  {user && (
                    <button onClick={() => setIsEditingScore(true)} className="mt-3 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-blue-700 transition-all shadow-sm">
                      Skor Gir
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 min-w-[120px]">
              <a href={`/team/${match.awayTeamId}`}>
                <img src={awayTeam.flag || getFlagUrl(match.awayTeamId)} alt={awayTeam.name} className="w-20 h-14 rounded-xl shadow-inner object-cover hover:opacity-80 transition-opacity cursor-pointer" />
              </a>
              <a href={`/team/${match.awayTeamId}`} className="font-bold text-gray-900 dark:text-white text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{awayTeam.name}</a>
            </div>
          </div>

          {prediction && !isCompleted && (
            <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-sm">
              <span className="text-amber-700 dark:text-amber-400 font-medium">🎯 Tahminin:</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-800 dark:text-amber-300 text-lg">
                  {prediction.homeScore} - {prediction.awayScore}
                  {prediction.homeScore === prediction.awayScore && prediction.homePenaltyScore !== undefined && prediction.awayPenaltyScore !== undefined && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-normal ml-1.5">
                      (Pen: {prediction.homePenaltyScore} - {prediction.awayPenaltyScore})
                    </span>
                  )}
                </span>
                <button onClick={handleDeletePrediction} className="text-red-400 hover:text-red-600 text-xs underline">Sil</button>
              </div>
            </div>
          )}

          {isCompleted && prediction && (
            <div className="mb-4 px-4 py-3 rounded-xl flex items-center justify-between text-sm border border-gray-200 dark:border-gray-600">
              <span className="font-medium text-gray-700 dark:text-gray-300">🎯 Tahminin:</span>
              <div className="flex items-center gap-2">
                <span className={
                  (prediction.homeScore === currentMatch.homeScore && 
                   prediction.awayScore === currentMatch.awayScore && 
                   (prediction.homeScore !== prediction.awayScore || 
                    (prediction.homePenaltyScore === currentMatch.homePenaltyScore && 
                     prediction.awayPenaltyScore === currentMatch.awayPenaltyScore)))
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold text-lg' 
                  : 'text-red-500 dark:text-red-400 font-bold text-lg'
                }>
                  {prediction.homeScore} - {prediction.awayScore}
                  {prediction.homeScore === prediction.awayScore && prediction.homePenaltyScore !== undefined && prediction.awayPenaltyScore !== undefined && (
                    <span className="text-xs font-normal ml-1.5">(Pen: {prediction.homePenaltyScore} - {prediction.awayPenaltyScore})</span>
                  )}
                </span>
                {(prediction.homeScore === currentMatch.homeScore && 
                  prediction.awayScore === currentMatch.awayScore && 
                  (prediction.homeScore !== prediction.awayScore || 
                   (prediction.homePenaltyScore === currentMatch.homePenaltyScore && 
                    prediction.awayPenaltyScore === currentMatch.awayPenaltyScore))) && (
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">✓ Tam isabet!</span>
                )}
              </div>
            </div>
          )}

          {!isCompleted && user && !isEditingPred && !prediction && (
            <div className="mb-4">
              {match.homeTeamId === 'TBD' || match.awayTeamId === 'TBD' ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 text-center font-medium">
                  Eşleşen takımlar henüz belli olmadığı için tahmin yapılamaz.
                </div>
              ) : (
                <button onClick={() => { setIsEditingPred(true); setHomePred(''); setAwayPred(''); }} className="btn-primary w-full py-3 text-center">
                  🎯 Tahmin Yap
                </button>
              )}
            </div>
          )}

          {!user && !isCompleted && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300 text-center">
              Tahmin yapmak için <a href="/auth/login" className="font-semibold underline">giriş yapın</a>
            </div>
          )}

          {isEditingPred && (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-3 text-center">🎯 Tahminini Gir</p>
              <div className="flex items-center gap-4 justify-center">
                <span className="font-bold text-gray-900 dark:text-white">{homeTeam.name}</span>
                <input type="number" min="0" max="99" value={homePred} onChange={e => setHomePred(e.target.value)} className="input-field w-16 text-center text-xl font-bold" placeholder="0" />
                <span className="text-gray-400 dark:text-gray-500 text-xl font-bold">:</span>
                <input type="number" min="0" max="99" value={awayPred} onChange={e => setAwayPred(e.target.value)} className="input-field w-16 text-center text-xl font-bold" placeholder="0" />
                <span className="font-bold text-gray-900 dark:text-white">{awayTeam.name}</span>
              </div>
              {homePred !== '' && awayPred !== '' && parseInt(homePred) === parseInt(awayPred) && match.stage !== 'Grup' && (
                <div className="flex flex-col items-center gap-1.5 p-3 bg-amber-100/50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-xl mt-3 max-w-[200px] mx-auto">
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Penaltı Atışları</span>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="99" value={homePenPred} onChange={e => setHomePenPred(e.target.value)} className="input-field w-12 text-center text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-1" placeholder="P" />
                    <span className="text-sm font-bold text-gray-400">-</span>
                    <input type="number" min="0" max="99" value={awayPenPred} onChange={e => setAwayPenPred(e.target.value)} className="input-field w-12 text-center text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-1" placeholder="P" />
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-4 justify-center">
                <button onClick={handlePredict} className="bg-amber-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors">Kaydet</button>
                <button onClick={() => setIsEditingPred(false)} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">İptal</button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-3">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="font-medium">{formatDate(match.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="font-medium">{match.time} TR</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="font-medium">{match.venue}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>{match.city}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="font-semibold">{match.country}</span>
            </div>
          </div>
        </div>

        {(hasScore || isLive) && matchEvents.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Maç Olayları
            </h3>
            <div className="space-y-2">
              {[...matchEvents].sort((a, b) => (a.minute || 90) - (b.minute || 90)).map((event, i) => {
                const team = getTeam(event.teamId);
                const isGoal = event.eventType === 'goal' || (!event.eventType && !event.isOwnGoal);
                const isYellow = event.eventType === 'yellowCard';
                const isRedCard = event.eventType === 'redCard';
                return (
                  <div key={event.id || i} className={`flex items-center gap-3 p-3 rounded-xl ${
                    isRedCard ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                    isYellow ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' :
                    'bg-gray-50 dark:bg-gray-700/50'
                  }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      isGoal ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                      isYellow ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {isGoal ? (event.minute != null ? `${event.minute}'` : '⚽') :
                       isYellow ? (event.minute != null ? `${event.minute}'` : '🟨') :
                       (event.minute != null ? `${event.minute}'` : '🟥')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isGoal && <span className="text-base">⚽</span>}
                        {isYellow && <span className="text-base">🟨</span>}
                        {isRedCard && <span className="text-base">🟥</span>}
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {event.playerName || 'Bilinmiyor'}
                          {event.isOwnGoal && <span className="text-red-500 text-xs ml-1">(K.K.)</span>}
                          {event.isPenalty && <span className="text-amber-600 dark:text-amber-400 text-xs ml-1">(Penaltı)</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <img src={team.flag || getFlagUrl(event.teamId)} alt="" className="w-4 h-3 rounded object-cover" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{team.name || event.teamId}</span>
                      </div>
                    </div>
                    {user && isGoal && (
                      <button onClick={() => handleDeleteEvent(event.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Kullanıcı Tahminleri */}
        <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Kullanıcı Tahminleri
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full ml-1">
              {userPredictions.length} Tahmin
            </span>
          </h3>

          {userPredictions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Bu maç için henüz tahmin girilmemiş.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userPredictions.map((pred, idx) => {
                const isCurrentUser = pred.userId === user?.id;
                return (
                  <div
                    key={pred.userId || idx}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurrentUser
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/50 dark:border-emerald-500/30 shadow-sm shadow-emerald-500/5'
                        : 'bg-gray-50/50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isCurrentUser
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {pred.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm font-semibold truncate ${
                        isCurrentUser ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {pred.userName}
                        {isCurrentUser && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium ml-1">Sen</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-gray-900 dark:text-white text-base block">
                          {pred.homeScore} - {pred.awayScore}
                        </span>
                        {pred.homeScore === pred.awayScore && pred.homePenaltyScore !== undefined && pred.awayPenaltyScore !== undefined && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-semibold leading-none mt-0.5">
                            (Pen: {pred.homePenaltyScore} - {pred.awayPenaltyScore})
                          </span>
                        )}
                      </div>
                      {pred.hasPoints && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          pred.points === 3 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                          pred.points === 2 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                          pred.points === 1 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          +{pred.points} P
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {hasScore && user && (
          <div className="mt-4">
            {!showEventForm ? (
              <button onClick={() => { setShowEventForm(true); setEventTeam(match.homeTeamId); }} className="btn-secondary w-full py-2.5 text-sm">
                + Gol Ekle
              </button>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4">Gol Ekle</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Takım</label>
                    <select value={eventTeam} onChange={e => setEventTeam(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm">
                      <option value="">Takım seçin</option>
                      <option value={match.homeTeamId}>{homeTeam.name}</option>
                      <option value={match.awayTeamId}>{awayTeam.name}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Oyuncu Adı</label>
                    <input type="text" value={eventPlayer} onChange={e => setEventPlayer(e.target.value)} placeholder="Örn: Lionel Messi" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dakika</label>
                    <input type="number" value={eventMinute} onChange={e => setEventMinute(e.target.value)} placeholder="Örn: 45" min="1" max="120" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={eventIsPenalty} onChange={e => setEventIsPenalty(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Penaltı</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={eventIsOwnGoal} onChange={e => setEventIsOwnGoal(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Kendi kalesine</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddEvent} className="btn-primary px-6 py-2 text-sm">Kaydet</button>
                    <button onClick={() => setShowEventForm(false)} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500">İptal</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {sameDayMatches.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Aynı Gündeki Diğer Maçlar</h3>
            <div className="space-y-3">
              {sameDayMatches.map(m => {
                const ht = getTeam(m.homeTeamId);
                const at = getTeam(m.awayTeamId);
                return (
                  <a key={m.id} href={`/match/${m.id}`} className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                    <div className="flex items-center justify-between">
                      <span className={`stage-badge border text-xs ${getStageStyle(m.stage)}`}>{m.stage}</span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{m.time} TR</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{ht.name}</span>
                      <span className="text-gray-400 dark:text-gray-500 font-bold">vs</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{at.name}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={() => router.push('/')} className="btn-secondary px-8 py-3">
            ← Ana Sayfaya Dön
          </button>
        </div>
      </main>
    </div>
  );
}