'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import DaySelector from '@/components/DaySelector';
import MatchCard, { MiniMatchCard } from '@/components/MatchCard';
import GroupStandings from '@/components/GroupStandings';
import NotificationsList from '@/components/NotificationsList';
import NotificationModal from '@/components/NotificationModal';
// Removed NewsSection import
import ScorerEntryForm from '@/components/ScorerEntryForm';
import SharePredictionCard from '@/components/SharePredictionCard';
import BracketView from '@/components/BracketView';
import BracketPredictor from '@/components/BracketPredictor';
import CompareModal from '@/components/CompareModal';
import LeaguesView from '@/components/LeaguesView';
import { matches as allMatches } from '@/data/fixtures';
import { getTeam, getFlagUrl } from '@/data/teams';
import { useLiveScores } from '@/hooks/useLiveScores';
import { getMatchStatus } from '@/lib/match-status';

export default function Home() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('fixtures');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.history.pushState(null, '', `/?tab=${tab}`);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || 'fixtures';
      setActiveTab(tab);
    };

    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  const [bracketView, setBracketView] = useState<'real' | 'predict'>('real');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date().toLocaleDateString('sv-SE');
    if (today >= '2026-06-11' && today <= '2026-07-20') {
      return today;
    }
    return '2026-06-11';
  });
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [localMatches, setLocalMatches] = useState(allMatches);
  const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notificationModal, setNotificationModal] = useState<{ matchId: string; matchName: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<{ userId: string; name: string; totalPredictions: number; completedPredictions: number; exact: number; outcome: number; goalCount: number; missed: number; points: number }[]>([]);
  const [scorerLeaderboard, setScorerLeaderboard] = useState<{ teamId: string; playerName: string; goals: number; penalties: number; ownGoals: number }[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<{ user: { id: string; name: string }; predictions: Record<string, { homeScore: number; awayScore: number }>; stats: { total: number; exact: number; outcome: number; goalCount: number; missed: number; points: number } } | null>(null);

  const { mergedMatches: matches, isLoading: liveLoading, lastUpdated, isApiConfigured, refresh: refreshLiveScores } = useLiveScores(localMatches);

  const [targetMatchDetails, setTargetMatchDetails] = useState<any>(null);
  const [targetMatchEvents, setTargetMatchEvents] = useState<any[]>([]);
  const [isTargetLoading, setIsTargetLoading] = useState(false);

  const liveMatch = matches.find(m => getMatchStatus(m).isLive);
  const lastCompletedMatch = matches
    .filter(m => getMatchStatus(m).isCompleted)
    .sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}:00`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}:00`).getTime();
      return dateTimeB - dateTimeA;
    })[0];

  const targetMatch = liveMatch || lastCompletedMatch;

  useEffect(() => {
    if (!targetMatch) return;
    
    let isMounted = true;
    setIsTargetLoading(true);
    
    const fetchTargetDetails = async () => {
      try {
        const res = await fetch(`/api/live-scores?date=${targetMatch.date}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const apiMatch = (data.matches || []).find((m: any) => 
            m.homeCode === targetMatch.homeTeamId && m.awayCode === targetMatch.awayTeamId
          );
          if (apiMatch) {
            setTargetMatchDetails(apiMatch);
            setTargetMatchEvents(apiMatch.goals || []);
          } else {
            const scorersRes = await fetch('/api/scorers');
            if (scorersRes.ok && isMounted) {
              const scorersData = await scorersRes.json();
              const dbGoals = (scorersData.scorers || [])
                .filter((s: any) => s.matchId === targetMatch.id)
                .map((s: any) => ({
                  minute: s.minute,
                  playerName: s.playerName,
                  teamCode: s.teamId,
                  isPenalty: s.isPenalty === 1,
                  isOwnGoal: s.isOwnGoal === 1,
                  eventType: 'goal'
                }));
              setTargetMatchEvents(dbGoals);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsTargetLoading(false);
      }
    };
    
    fetchTargetDetails();
    
    let interval: NodeJS.Timeout;
    if (targetMatch && !targetMatch.isCompleted) {
      interval = setInterval(fetchTargetDetails, 30000);
    }
    
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [targetMatch?.id, targetMatch?.isCompleted, targetMatch?.date]);

  const homeTeam = targetMatch ? getTeam(targetMatch.homeTeamId) : null;
  const awayTeam = targetMatch ? getTeam(targetMatch.awayTeamId) : null;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/scores');
        if (res.ok) {
          const data = await res.json();
          const scores: Record<string, { homeScore: number; awayScore: number; isCompleted: boolean }> = data.scores || {};
          if (Object.keys(scores).length > 0) {
            const updated = allMatches.map(m => {
              const s = scores[m.id];
              if (s) return { ...m, homeScore: s.homeScore, awayScore: s.awayScore, isCompleted: s.isCompleted };
              return m;
            });
            setLocalMatches(updated);
          }
        }
      } catch {}
      setIsLoading(false);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    refreshLiveScores(selectedDate);
  }, [selectedDate, refreshLiveScores]);

  useEffect(() => {
    if (!token) return;
    const fetchPredictions = async () => {
      try {
        const res = await fetch('/api/predictions', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setPredictions(data.predictions || {});
        }
      } catch {}
    };
    const fetchFavorites = async () => {
      try {
        const res = await fetch('/api/favorites', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites || []);
        }
      } catch {}
    };
    fetchPredictions();
    fetchFavorites();
  }, [token]);

  useEffect(() => {
    if (activeTab !== 'leaderboard') return;
    fetch('/api/leaderboard').then(r => r.ok ? r.json() : { leaderboard: [] }).then(data => setLeaderboard(data.leaderboard || [])).catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'scorers') return;
    fetch('/api/scorers').then(r => r.ok ? r.json() : { leaderboard: [] }).then(data => setScorerLeaderboard(data.leaderboard || [])).catch(() => {});
  }, [activeTab]);

  const saveScoreToDB = useCallback(async (matchId: string, homeScore: number, awayScore: number) => {
    try { await fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId, homeScore, awayScore }) }); } catch {}
  }, []);

  const deleteScoreFromDB = useCallback(async (matchId: string) => {
    try { await fetch('/api/scores', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId }) }); } catch {}
  }, []);

  const handleScoreUpdate = (matchId: string, homeScore: number, awayScore: number) => {
    setLocalMatches(prev => prev.map(m => m.id === matchId ? { ...m, homeScore, awayScore, isCompleted: true } : m));
    saveScoreToDB(matchId, homeScore, awayScore);
  };

  const handleClearScore = (matchId: string) => {
    setLocalMatches(prev => prev.map(m => m.id === matchId ? { ...m, homeScore: undefined, awayScore: undefined, isCompleted: false } : m));
    deleteScoreFromDB(matchId);
  };

  const handlePredict = async (matchId: string, homeScore: number, awayScore: number) => {
    setPredictions(prev => ({ ...prev, [matchId]: { homeScore, awayScore } }));
    if (token) {
      try { await fetch('/api/predictions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ matchId, homeScore, awayScore }) }); } catch {}
    }
  };

  const handleDeletePrediction = async (matchId: string) => {
    setPredictions(prev => { const next = { ...prev }; delete next[matchId]; return next; });
    if (token) {
      try { await fetch('/api/predictions', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ matchId }) }); } catch {}
    }
  };

  const toggleFavorite = async (matchId: string) => {
    if (!token) return;
    if (favorites.includes(matchId)) {
      setFavorites(prev => prev.filter(id => id !== matchId));
      try { await fetch('/api/favorites', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ matchId }) }); } catch {}
    } else {
      setFavorites(prev => [...prev, matchId]);
      try { await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ matchId }) }); } catch {}
    }
  };

  const handleNotify = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      const homeTeam = getTeam(match.homeTeamId);
      const awayTeam = getTeam(match.awayTeamId);
      setNotificationModal({ matchId, matchName: `${homeTeam.name} vs ${awayTeam.name}` });
    }
  };

  const handleSaveNotification = async (matchId: string, type: string, minutesBefore: number) => {
    if (token) {
      try { await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ matchId, type, minutesBefore }) }); } catch {}
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      scheduleNotification({ matchId, minutesBefore });
    } else if ('Notification' in window) {
      Notification.requestPermission().then(permission => { if (permission === 'granted') scheduleNotification({ matchId, minutesBefore }); });
    }
  };

  const scheduleNotification = (notification: { matchId: string; minutesBefore: number }) => {
    const match = matches.find(m => m.id === notification.matchId);
    if (!match) return;
    const matchDateTime = new Date(`${match.date}T${match.time}:00`);
    const notifyTime = new Date(matchDateTime.getTime() - notification.minutesBefore * 60000);
    const delay = notifyTime.getTime() - Date.now();
    if (delay > 0 && delay < 2147483647) {
      setTimeout(() => {
        const home = getTeam(match.homeTeamId);
        const away = getTeam(match.awayTeamId);
        new Notification('Dünya Kupası 2026', { body: `${home.name} vs ${away.name} yakında başlıyor!`, icon: '/favicon.ico' });
      }, delay);
    }
  };

  const getMatchesByDate = (date: string) => matches.filter(m => m.date === date);

  const getUpcomingMatches = () => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return matches.filter(m => !getMatchStatus(m).hasScore)
      .filter(m => { const d = new Date(`${m.date}T${m.time}:00`); return d >= now && d <= in24h; })
      .sort((a, b) => new Date(`${a.date}T${a.time}:00`).getTime() - new Date(`${b.date}T${b.time}:00`).getTime());
  };

  const getNextUpcomingMatches = () => {
    const now = new Date();
    return matches.filter(m => !getMatchStatus(m).hasScore)
      .filter(m => new Date(`${m.date}T${m.time}:00`) > now)
      .sort((a, b) => new Date(`${a.date}T${a.time}:00`).getTime() - new Date(`${b.date}T${b.time}:00`).getTime())
      .slice(0, 6);
  };

  const getRecentCompletedMatches = () => {
    return matches.filter(m => getMatchStatus(m).hasScore)
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  };

  const getMatchStats = () => {
    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.isCompleted).length;
    const totalGoals = matches.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0);
    const predictionsCount = Object.keys(predictions).length;
    const upcoming24h = getUpcomingMatches().length;
    return { totalMatches, completedMatches, totalGoals, predictionsCount, upcoming24h };
  };

  const getPredictionStats = () => {
    const completedWithPredictions = matches.filter(m => m.isCompleted && predictions[m.id]);
    if (completedWithPredictions.length === 0) return { total: 0, exact: 0, outcome: 0, goalCount: 0, missed: 0 };
    let exact = 0, outcome = 0, goalCount = 0, missed = 0;
    completedWithPredictions.forEach(m => {
      const pred = predictions[m.id];
      if (pred.homeScore === m.homeScore && pred.awayScore === m.awayScore) { exact++; }
      else {
        const predOutcome = pred.homeScore > pred.awayScore ? 'home' : pred.homeScore < pred.awayScore ? 'away' : 'draw';
        const actualOutcome = m.homeScore! > m.awayScore! ? 'home' : m.homeScore! < m.awayScore! ? 'away' : 'draw';
        if (predOutcome === actualOutcome) { outcome++; }
        else if (pred.homeScore === m.homeScore || pred.awayScore === m.awayScore) { goalCount++; }
        else { missed++; }
      }
    });
    return { total: completedWithPredictions.length, exact, outcome, goalCount, missed };
  };

  const stats = getMatchStats();
  const predStats = getPredictionStats();
  const upcoming24h = getUpcomingMatches();
  const nextUpcoming = getNextUpcomingMatches();
  const recentCompleted = getRecentCompletedMatches();
  const favoriteMatches = matches.filter(m => favorites.includes(m.id));
  const completedMatches = matches.filter(m => getMatchStatus(m).hasScore);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent transition-colors">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'fixtures' && (
          <div className="space-y-8">
            <div className="wc-hero rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/10 dark:shadow-purple-500/10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black mb-2 tracking-tight">2026 FIFA Dünya Kupası</h2>
                  <p className="text-white/80 text-lg font-medium">11 Haziran - 19 Temmuz 2026</p>
                  <div className="flex items-center gap-2 mt-2">
                    {isApiConfigured ? (
                      <button onClick={() => refreshLiveScores(selectedDate)} disabled={liveLoading} className="flex items-center gap-1.5 text-xs bg-emerald-400/20 text-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-400/30 transition-colors disabled:opacity-50">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                        Skorları Güncelle
                        {lastUpdated && <span className="opacity-70">• {new Date(lastUpdated).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs bg-amber-400/20 text-amber-200 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 bg-amber-400 rounded-full" />
                        Manuel mod
                      </span>
                    )}
                    {liveLoading && <span className="text-xs text-emerald-200 animate-pulse">Güncelleniyor...</span>}
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="text-center bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm min-w-[80px]">
                    <p className="text-2xl font-black text-amber-300">🏆</p>
                    <p className="text-white/70 text-[11px] mt-1 font-semibold">Trophy</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm min-w-[80px]">
                    <p className="text-2xl font-black">{stats.totalMatches}</p>
                    <p className="text-white/70 text-[11px] mt-1">Toplam Maç</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm min-w-[80px]">
                    <p className="text-2xl font-black text-emerald-300">{stats.completedMatches}</p>
                    <p className="text-white/70 text-[11px] mt-1">Biten</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm min-w-[80px]">
                    <p className="text-2xl font-black text-teal-300">{stats.totalGoals}</p>
                    <p className="text-white/70 text-[11px] mt-1">Gol</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm min-w-[80px]">
                    <p className="text-2xl font-black text-indigo-300">{stats.predictionsCount}</p>
                    <p className="text-white/70 text-[11px] mt-1">Tahmin</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-lg">⏰</div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">24 Saat İçinde Başlayacaklar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{upcoming24h.length} yaklaşan maç</p>
                  </div>
                </div>
                {upcoming24h.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <p className="text-3xl mb-2">🏟️</p>
                    <p className="text-sm">Önümüzdeki 24 saatte maç yok</p>
                  </div>
                ) : (
                  <div className="space-y-3">{upcoming24h.map(m => <MiniMatchCard key={m.id} match={m} />)}</div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-lg">⚽</div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Son Oynanan Maçlar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{recentCompleted.length} tamamlanan maç</p>
                  </div>
                </div>
                {recentCompleted.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <p className="text-3xl mb-2">📋</p>
                    <p className="text-sm">Henüz tamamlanan maç yok</p>
                  </div>
                ) : (
                  <div className="space-y-3">{recentCompleted.map(m => <MiniMatchCard key={m.id} match={m} />)}</div>
                )}
              </div>

              {targetMatch && homeTeam && awayTeam ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        {getMatchStatus(targetMatch).isLive ? (
                          <>
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Canlı</span>
                            {targetMatchDetails?.minute && (
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                {targetMatchDetails.minute}'
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-lg">🏁</span>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Son Oynanan Maç</span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                        {targetMatch.stage}
                      </span>
                    </div>

                    {/* Teams and Score */}
                    <div className="flex items-center justify-between gap-4 py-2 mb-6">
                      <div className="flex flex-col items-center gap-2 flex-1 text-center">
                        <img 
                          src={homeTeam.flag || getFlagUrl(targetMatch.homeTeamId)} 
                          alt={homeTeam.name} 
                          className="w-12 h-8 rounded shadow-sm object-cover" 
                        />
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[80px]">
                          {homeTeam.name}
                        </span>
                      </div>

                      <div className="text-center">
                        <span className="text-3xl font-black text-gray-900 dark:text-white px-2">
                          {targetMatchDetails?.homeScore ?? targetMatch.homeScore ?? 0}
                        </span>
                        <span className="text-gray-400 dark:text-gray-600 font-bold">:</span>
                        <span className="text-3xl font-black text-gray-900 dark:text-white px-2">
                          {targetMatchDetails?.awayScore ?? targetMatch.awayScore ?? 0}
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-2 flex-1 text-center">
                        <img 
                          src={awayTeam.flag || getFlagUrl(targetMatch.awayTeamId)} 
                          alt={awayTeam.name} 
                          className="w-12 h-8 rounded shadow-sm object-cover" 
                        />
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[80px]">
                          {awayTeam.name}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Events */}
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 mb-6">
                      {isTargetLoading ? (
                        <div className="space-y-2 py-4">
                          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                        </div>
                      ) : targetMatchEvents.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs">
                          Maçta gol veya kart kaydı bulunmuyor
                        </div>
                      ) : (
                        [...targetMatchEvents]
                          .sort((a, b) => (a.minute || 90) - (b.minute || 90))
                          .map((event, index) => {
                            const isGoal = event.eventType === 'goal' || (!event.eventType && !event.isOwnGoal);
                            const isYellow = event.isYellowCard || event.eventType === 'yellowCard';
                            const isRed = event.isRedCard || event.eventType === 'redCard';
                            const eventTeam = getTeam(event.teamCode);

                            return (
                              <div key={index} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-gray-400 dark:text-gray-500 font-semibold min-w-[20px]">
                                    {event.minute ? `${event.minute}'` : '-'}
                                  </span>
                                  {isGoal && <span className="text-emerald-500">⚽</span>}
                                  {isYellow && <span className="text-amber-500">🟨</span>}
                                  {isRed && <span className="text-red-500">🟥</span>}
                                  <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[120px]">
                                    {event.playerName}
                                    {event.isOwnGoal && <span className="text-red-500 text-[10px] ml-1">(K.K.)</span>}
                                    {event.isPenalty && <span className="text-amber-600 dark:text-amber-400 text-[10px] ml-1">(Pen)</span>}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <img src={eventTeam.flag} alt="" className="w-3.5 h-2.5 rounded-sm object-cover" />
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{eventTeam.name}</span>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <a 
                    href={`/match/${targetMatch.id}`} 
                    className="w-full text-center py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    Maç Detayına Git
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm text-center py-12 text-gray-400 dark:text-gray-500">
                  <p className="text-4xl mb-2">⚽</p>
                  <p className="text-sm">Aktif veya oynanmış maç bulunamadı</p>
                </div>
              )}
            </div>

            {nextUpcoming.length > 0 && upcoming24h.length === 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-lg">📅</div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Sonraki Maçlar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Turnuvanın yaklaşan maçları</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nextUpcoming.map(m => <MiniMatchCard key={m.id} match={m} />)}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tarih Seç</h3>
              <DaySelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Maçlar — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {getMatchesByDate(selectedDate).length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">⚽</div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">Bu tarih için maç bulunmuyor</p>
                </div>
              ) : (
                getMatchesByDate(selectedDate).map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predictions[match.id] || null}
                    onScoreUpdate={user ? handleScoreUpdate : undefined}
                    onClearScore={user ? handleClearScore : undefined}
                    onPredict={user ? handlePredict : undefined}
                    onNotify={handleNotify}
                    onDeletePrediction={user ? handleDeletePrediction : undefined}
                    isFavorite={favorites.includes(match.id)}
                    onToggleFavorite={user ? toggleFavorite : undefined}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'bracket' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setBracketView('real')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${bracketView === 'real' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                Turnuva Ağacı
              </button>
              <button onClick={() => setBracketView('predict')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${bracketView === 'predict' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                🎯 Tahmin Turnuvası
              </button>
            </div>
            {bracketView === 'real' ? <BracketView /> : <BracketPredictor />}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-2xl">⚽</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Sonuçlar</h2>
                <p className="text-gray-500 dark:text-gray-400">Tamamlanan maçlar ve tahmin karşılaştırması</p>
              </div>
            </div>

            {completedMatches.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz sonuç yok</h3>
                <p className="text-gray-500 dark:text-gray-400">Skor girdiğinizde burada görünür</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedMatches.sort((a, b) => b.date.localeCompare(a.date)).map(match => {
                  const homeTeam = getTeam(match.homeTeamId);
                  const awayTeam = getTeam(match.awayTeamId);
                  const pred = predictions[match.id];
                  const { isCompleted: matchCompleted, isLive: matchLive } = getMatchStatus(match);
                  return (
                    <div key={match.id} className="match-card">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`stage-badge border ${match.stage === 'Grup' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'}`}>{match.stage}</span>
                        {match.group && <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{match.group}. Grup</span>}
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 flex-1">
                          <img src={homeTeam.flag || ''} alt={homeTeam.name} className="w-10 h-7 rounded object-cover" />
                          <span className="font-semibold text-gray-900 dark:text-white">{homeTeam.name}</span>
                        </div>
                        <div className="text-center px-4">
<p className="text-2xl font-black text-gray-900 dark:text-white">{match.homeScore} - {match.awayScore}</p>
                           {matchCompleted ? (
                             <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Maç Bitti</p>
                           ) : matchLive ? (
                             <p className="text-xs text-red-600 dark:text-red-400 font-bold mt-1">CANLI</p>
                           ) : (
                             <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Skor girildi</p>
                           )}
                        </div>
                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <span className="font-semibold text-gray-900 dark:text-white">{awayTeam.name}</span>
                          <img src={awayTeam.flag || ''} alt={awayTeam.name} className="w-10 h-7 rounded object-cover" />
                        </div>
                      </div>
                      {pred && (
                        <div className="mt-3 px-3 py-2 rounded-lg flex items-center justify-between text-sm border border-gray-200 dark:border-gray-600">
                          <span className="font-medium text-gray-700 dark:text-gray-300">🎯 Tahminin:</span>
                          <div className="flex items-center gap-2">
                            <span className={pred.homeScore === match.homeScore && pred.awayScore === match.awayScore ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-red-500 dark:text-red-400 font-bold'}>
                              {pred.homeScore} - {pred.awayScore}
                            </span>
                            {pred.homeScore === match.homeScore && pred.awayScore === match.awayScore && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">✓ Tam isabet!</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'scorers' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-2xl">👟</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Gol Kralı</h2>
                <p className="text-gray-500 dark:text-gray-400">Turnuvanın en golcü oyuncuları</p>
              </div>
            </div>

            {scorerLeaderboard.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">⚽</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz gol verisi yok</h3>
                <p className="text-gray-500 dark:text-gray-400">Skor girişi yapıldığında gol krallığı burada görünür</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="text-left py-4 px-4">#</th>
                        <th className="text-left py-4 px-4">Oyuncu</th>
                        <th className="text-center py-4 px-2">Takım</th>
                        <th className="text-center py-4 px-2">Gol</th>
                        <th className="text-center py-4 px-4">Penaltı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scorerLeaderboard.map((entry, index) => {
                        const team = getTeam(entry.teamId);
                        return (
                          <tr key={`${entry.teamId}-${entry.playerName}`} className={`border-b border-gray-100 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${index < 3 ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                            <td className="py-4 px-4">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : index === 1 ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200' : index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                {index + 1}
                              </div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">{entry.playerName}</td>
                            <td className="text-center py-4 px-2">
                              <div className="flex items-center justify-center gap-1.5">
                                <img src={team.flag || getFlagUrl(entry.teamId)} alt={team.name} className="w-5 h-3.5 rounded object-cover" />
                                <span className="text-xs text-gray-600 dark:text-gray-300">{team.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-4 px-2">
                              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{entry.goals}</span>
                            </td>
                            <td className="text-center py-4 px-4 text-gray-500 dark:text-gray-400">
                              {entry.penalties > 0 ? entry.penalties : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {user && (
              <ScorerEntryForm matches={matches} onSubmitted={() => {
                fetch('/api/scorers').then(r => r.ok ? r.json() : { leaderboard: [] }).then(data => setScorerLeaderboard(data.leaderboard || [])).catch(() => {});
              }} />
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-2xl">📊</div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Grup Puan Durumu</h2>
                  <p className="text-gray-500 dark:text-gray-400">Takımların durumunu takip edin</p>
                </div>
              </div>
              <button onClick={() => setShowCompare(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Karşılaştır
              </button>
            </div>
            <GroupStandings selectedGroup={selectedGroup} onGroupChange={setSelectedGroup} matches={matches} />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-2xl">🏆</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Sıralama</h2>
                <p className="text-gray-500 dark:text-gray-400">En başarılı tahminciler</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="text-left py-4 px-4">#</th>
                      <th className="text-left py-4 px-4">Kullanıcı</th>
                      <th className="text-center py-4 px-2">Tahmin</th>
                      <th className="text-center py-4 px-2">Tam</th>
                      <th className="text-center py-4 px-2">Sonuç</th>
                      <th className="text-center py-4 px-2">Gol</th>
                      <th className="text-center py-4 px-4">Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500">
                          <p className="text-3xl mb-2">🏆</p>
                          <p className="text-sm">Henüz sıralama yok</p>
                          <p className="text-xs mt-1">Tahmin yapıldığında burada görünür</p>
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((entry, index) => (
                        <tr key={entry.userId} onClick={() => { setSelectedUserId(entry.userId); fetch(`/api/leaderboard?userId=${entry.userId}`).then(r => r.json()).then(d => setUserDetail(d)).catch(() => {}); }} className={`border-b border-gray-100 dark:border-gray-700 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer ${index < 3 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                          <td className="py-4 px-4">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : index === 1 ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200' : index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">{entry.name}</td>
                          <td className="text-center py-4 px-2 text-gray-600 dark:text-gray-300">{entry.totalPredictions}</td>
                          <td className="text-center py-4 px-2 text-emerald-600 dark:text-emerald-400 font-medium">{entry.exact}</td>
                          <td className="text-center py-4 px-2 text-blue-600 dark:text-blue-400">{entry.outcome}</td>
                          <td className="text-center py-4 px-2 text-amber-600 dark:text-amber-400">{entry.goalCount}</td>
                          <td className="text-center py-4 px-4"><span className="text-lg font-black text-blue-600 dark:text-blue-400">{entry.points}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <p className="font-medium mb-1">Puanlama:</p>
              <p>• Tam isabet (gerçek skorun aynısı): <strong>3 puan</strong></p>
              <p>• Sonuç doğru (kazanan/beraberlik doğru, skor farklı): <strong>2 puan</strong></p>
              <p>• Bir takımın gol sayısı doğru (tam skor değil): <strong>1 puan</strong></p>
              <p>• Isabet yok: <strong>0 puan</strong></p>
            </div>
          </div>
        )}

        {selectedUserId && userDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setSelectedUserId(null); setUserDetail(null); }}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 pb-4 border-b border-gray-100 dark:border-gray-700 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                      {userDetail.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{userDetail.user.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>{userDetail.stats.total} tahmin</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{userDetail.stats.exact} tam</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{userDetail.stats.outcome} sonuç</span>
                        <span className="text-amber-600 dark:text-amber-400">{userDetail.stats.goalCount} gol</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{userDetail.stats.points} puan</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedUserId(null); setUserDetail(null); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="p-6 pt-4 space-y-2">
                {Object.entries(userDetail.predictions)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .slice(0, 30)
                  .map(([matchId, pred]) => {
                    const match = matches.find(m => m.id === matchId);
                    if (!match) return null;
                    const homeTeam = getTeam(match.homeTeamId);
                    const awayTeam = getTeam(match.awayTeamId);
                    return (
                      <div key={matchId} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <img src={homeTeam.flag || getFlagUrl(match.homeTeamId)} alt="" className="w-6 h-4 rounded object-cover flex-shrink-0" />
                          <span className="text-xs text-gray-600 dark:text-gray-300 font-medium truncate">{homeTeam.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mx-0.5">vs</span>
                          <span className="text-xs text-gray-600 dark:text-gray-300 font-medium truncate">{awayTeam.name}</span>
                          <img src={awayTeam.flag || getFlagUrl(match.awayTeamId)} alt="" className="w-6 h-4 rounded object-cover flex-shrink-0" />
                        </div>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-sm tabular-nums ml-2">{pred.homeScore} - {pred.awayScore}</span>
                      </div>
                    );
                  })}
                {Object.keys(userDetail.predictions).length > 30 && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">+{Object.keys(userDetail.predictions).length - 30} tahmin daha</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-2xl">🎯</div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Tahminlerim</h2>
                  <p className="text-gray-500 dark:text-gray-400">Maç sonuçlarını tahmin edin ve skorlarıyla karşılaştırın</p>
                </div>
              </div>
              {user && Object.keys(predictions).length > 0 && (
                <SharePredictionCard
                  userName={user.name}
                  predictions={predictions}
                  matches={matches}
                  exact={predStats.exact}
                  outcome={predStats.outcome}
                  goalCount={predStats.goalCount}
                  points={predStats.exact * 3 + predStats.outcome * 2 + predStats.goalCount}
                />
              )}
            </div>

            {!user ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">👤</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Giriş Yapın</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Tahmin yapmak için giriş yapmanız gerekiyor</p>
                <a href="/auth/login" className="btn-primary inline-block px-8 py-3">Giriş Yap</a>
              </div>
            ) : (
              <>
                {Object.keys(predictions).length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tahmin İstatistikleri</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.predictionsCount}</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Toplam Tahmin</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{predStats.exact}</p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">Tam İsabet (3p)</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{predStats.outcome}</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Sonuç Doğru (2p)</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{predStats.goalCount}</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">Gol Doğru (1p)</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-red-600 dark:text-red-400">{predStats.missed}</p>
                        <p className="text-sm text-red-700 dark:text-red-300">Isabet Yok</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {Object.keys(predictions).length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                      <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">🎯</div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz Tahmin Yok</h3>
                      <p className="text-gray-500 dark:text-gray-400">Ana Sayfa sekmesinden maçlar için tahmin yapın!</p>
                    </div>
                  ) : (
                    matches.filter(m => predictions[m.id]).map(match => {
                      const pred = predictions[match.id];
                      const homeTeam = getTeam(match.homeTeamId);
                      const awayTeam = getTeam(match.awayTeamId);
                      return (
                        <div key={match.id} className="match-card">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`stage-badge border ${match.stage === 'Grup' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'}`}>{match.stage}</span>
                            {match.group && <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{match.group}. Grup</span>}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <img src={homeTeam.flag} alt={homeTeam.name} className="w-10 h-7 rounded object-cover" />
                              <span className="font-semibold text-gray-900 dark:text-white">{homeTeam.name}</span>
                            </div>
                            <div className="text-center px-4">
                              {match.isCompleted ? (
                                <div>
                                  <div className="text-2xl font-black text-gray-900 dark:text-white">{match.homeScore} - {match.awayScore}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Gerçek Skor</div>
                                </div>
                              ) : (
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Henüz oynanmadı</div>
                              )}
                              <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">🎯 {pred.homeScore} - {pred.awayScore}</div>
                            </div>
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <span className="font-semibold text-gray-900 dark:text-white">{awayTeam.name}</span>
                              <img src={awayTeam.flag} alt={awayTeam.name} className="w-10 h-7 rounded object-cover" />
                            </div>
                          </div>
                          {match.isCompleted && (() => {
                            const isExact = pred.homeScore === match.homeScore && pred.awayScore === match.awayScore;
                            const isClose = !isExact && (pred.homeScore === match.homeScore || pred.awayScore === match.awayScore || (pred.homeScore - pred.awayScore === match.homeScore! - match.awayScore!));
                            return (
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isExact && <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-1.5 rounded-full">✓ Tam isabet!</span>}
                                  {isClose && !isExact && <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-1.5 rounded-full">~ Yakın tahmin</span>}
                                  {!isExact && !isClose && <span className="text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-1.5 rounded-full">✗ Isabet yok</span>}
                                </div>
                                <button onClick={() => handleDeletePrediction(match.id)} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline">Sil</button>
                              </div>
                            );
                          })()}
                          {!match.isCompleted && (
                            <div className="mt-3 flex justify-end">
                              <button onClick={() => handleDeletePrediction(match.id)} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline">Tahmini Sil</button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'leagues' && <LeaguesView />}

        {activeTab === 'favorites' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-2xl">⭐</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Favorilerim</h2>
                <p className="text-gray-500 dark:text-gray-400">Takip etmek istediğiniz maçlar</p>
              </div>
            </div>

            {!user ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">👤</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Giriş Yapın</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Favori maçları kullanmak için giriş yapmanız gerekiyor</p>
                <a href="/auth/login" className="btn-primary inline-block px-8 py-3">Giriş Yap</a>
              </div>
            ) : favoriteMatches.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">⭐</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Favori Maç Yok</h3>
                <p className="text-gray-500 dark:text-gray-400">Ana Sayfa'daki maçlarda ⭐ butonuna tıklayarak favorilere ekleyin</p>
              </div>
            ) : (
              <div className="space-y-4">
                {favoriteMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predictions[match.id] || null}
                    onScoreUpdate={user ? handleScoreUpdate : undefined}
                    onClearScore={user ? handleClearScore : undefined}
                    onPredict={user ? handlePredict : undefined}
                    onNotify={handleNotify}
                    onDeletePrediction={user ? handleDeletePrediction : undefined}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-2xl">🔔</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Bildirimlerim</h2>
                <p className="text-gray-500 dark:text-gray-400">Maçları kaçırmayın!</p>
              </div>
            </div>
            <NotificationsList />
          </div>
        )}
      </main>

      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🏆</span>
            <span className="font-bold text-gray-900 dark:text-white">FIFA Dünya Kupası 2026</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Fikstür Takip</p>
        </div>
      </footer>

      {notificationModal && (
        <NotificationModal
          matchId={notificationModal.matchId}
          matchName={notificationModal.matchName}
          onClose={() => setNotificationModal(null)}
          onSave={handleSaveNotification}
        />
      )}

      {showCompare && <CompareModal onClose={() => setShowCompare(false)} />}
    </div>
  );
}