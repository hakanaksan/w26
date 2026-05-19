'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import DaySelector from '@/components/DaySelector';
import MatchCard, { MiniMatchCard } from '@/components/MatchCard';
import GroupStandings from '@/components/GroupStandings';
import NotificationsList from '@/components/NotificationsList';
import NotificationModal from '@/components/NotificationModal';
import { matches as allMatches } from '@/data/fixtures';
import { getTeam } from '@/data/teams';
import { useLiveScores } from '@/hooks/useLiveScores';

export default function Home() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('fixtures');
  const [selectedDate, setSelectedDate] = useState('2026-06-11');
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [localMatches, setLocalMatches] = useState(allMatches);
  const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({});
  const [notificationModal, setNotificationModal] = useState<{ matchId: string; matchName: string } | null>(null);

  const { mergedMatches: matches, isLoading: liveLoading, lastUpdated, isApiConfigured, refresh: refreshLiveScores } = useLiveScores(localMatches);

  useEffect(() => {
    if (!token) return;
    const fetchPredictions = async () => {
      try {
        const res = await fetch('/api/predictions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPredictions(data.predictions || {});
        }
      } catch {}
    };
    fetchPredictions();
  }, [token]);

  useEffect(() => {
    const fetchScores = async () => {
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
    };
    fetchScores();
  }, []);

  const saveScoreToDB = useCallback(async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, homeScore, awayScore }),
      });
    } catch {}
  }, []);

  const deleteScoreFromDB = useCallback(async (matchId: string) => {
    try {
      await fetch('/api/scores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
    } catch {}
  }, []);

  const handleScoreUpdate = (matchId: string, homeScore: number, awayScore: number) => {
    setLocalMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, homeScore, awayScore, isCompleted: true } : m
    ));
    saveScoreToDB(matchId, homeScore, awayScore);
  };

  const handleClearScore = (matchId: string) => {
    setLocalMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, homeScore: undefined, awayScore: undefined, isCompleted: false } : m
    ));
    deleteScoreFromDB(matchId);
  };

  const handlePredict = async (matchId: string, homeScore: number, awayScore: number) => {
    setPredictions(prev => ({ ...prev, [matchId]: { homeScore, awayScore } }));

    if (token) {
      try {
        await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ matchId, homeScore, awayScore }),
        });
      } catch {}
    }
  };

  const handleNotify = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      const homeTeam = getTeam(match.homeTeamId);
      const awayTeam = getTeam(match.awayTeamId);
      setNotificationModal({
        matchId,
        matchName: `${homeTeam.name} vs ${awayTeam.name}`,
      });
    }
  };

  const handleSaveNotification = async (matchId: string, type: string, minutesBefore: number) => {
    if (token) {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ matchId, type, minutesBefore }),
        });
      } catch {}
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      scheduleNotification({ matchId, minutesBefore });
    } else if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') scheduleNotification({ matchId, minutesBefore });
      });
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
    return matches.filter(m => !m.isCompleted && m.homeScore === undefined)
      .filter(m => { const d = new Date(`${m.date}T${m.time}:00`); return d >= now && d <= in24h; })
      .sort((a, b) => new Date(`${a.date}T${a.time}:00`).getTime() - new Date(`${b.date}T${b.time}:00`).getTime());
  };

  const getNextUpcomingMatches = () => {
    const now = new Date();
    return matches.filter(m => !m.isCompleted && m.homeScore === undefined)
      .filter(m => new Date(`${m.date}T${m.time}:00`) > now)
      .sort((a, b) => new Date(`${a.date}T${a.time}:00`).getTime() - new Date(`${b.date}T${b.time}:00`).getTime())
      .slice(0, 6);
  };

  const getRecentCompletedMatches = () => {
    return matches.filter(m => m.isCompleted || m.homeScore !== undefined)
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
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
    if (completedWithPredictions.length === 0) return { total: 0, exact: 0, close: 0, missed: 0 };
    let exact = 0, close = 0, missed = 0;
    completedWithPredictions.forEach(m => {
      const pred = predictions[m.id];
      if (pred.homeScore === m.homeScore && pred.awayScore === m.awayScore) { exact++; }
      else if (pred.homeScore === m.homeScore || pred.awayScore === m.awayScore || (pred.homeScore - pred.awayScore === m.homeScore! - m.awayScore!)) { close++; }
      else { missed++; }
    });
    return { total: completedWithPredictions.length, exact, close, missed };
  };

  const stats = getMatchStats();
  const predStats = getPredictionStats();
  const upcoming24h = getUpcomingMatches();
  const nextUpcoming = getNextUpcomingMatches();
  const recentCompleted = getRecentCompletedMatches();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'fixtures' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black mb-2">2026 FIFA Dünya Kupası</h2>
                  <p className="text-blue-100 text-lg">11 Haziran - 19 Temmuz 2026 • ABD, Kanada ve Meksika</p>
                  <div className="flex items-center gap-2 mt-2">
                    {isApiConfigured ? (
                      <button onClick={refreshLiveScores} disabled={liveLoading} className="flex items-center gap-1.5 text-xs bg-emerald-400/20 text-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-400/30 transition-colors disabled:opacity-50">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                        Skorları Güncelle
                        {lastUpdated && <span className="opacity-70">• {new Date(lastUpdated).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs bg-amber-400/20 text-amber-200 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 bg-amber-400 rounded-full" />
                        Manuel mod — skorları kendiniz girebilirsiniz
                      </span>
                    )}
                    {liveLoading && <span className="text-xs text-blue-200 animate-pulse">Güncelleniyor...</span>}
                  </div>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <div className="text-center bg-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm">
                    <p className="text-2xl font-black">{stats.totalMatches}</p>
                    <p className="text-blue-200 text-xs">Toplam Maç</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm">
                    <p className="text-2xl font-black">{stats.completedMatches}</p>
                    <p className="text-blue-200 text-xs">Biten</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm">
                    <p className="text-2xl font-black">{stats.totalGoals}</p>
                    <p className="text-blue-200 text-xs">Gol</p>
                  </div>
                  <div className="text-center bg-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm">
                    <p className="text-2xl font-black">{stats.predictionsCount}</p>
                    <p className="text-blue-200 text-xs">Tahmin</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-lg">⏰</div>
                  <div>
                    <h3 className="font-bold text-gray-900">24 Saat İçinde Başlayacaklar</h3>
                    <p className="text-sm text-gray-500">{upcoming24h.length} yaklaşan maç</p>
                  </div>
                </div>
                {upcoming24h.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-3xl mb-2">🏟️</p>
                    <p className="text-sm">Önümüzdeki 24 saatte maç yok</p>
                    <p className="text-xs mt-1">Aşağıdaki yaklaşan maçlara göz atın</p>
                  </div>
                ) : (
                  <div className="space-y-3">{upcoming24h.map(m => <MiniMatchCard key={m.id} match={m} />)}</div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">⚽</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Son Oynanan Maçlar</h3>
                    <p className="text-sm text-gray-500">{recentCompleted.length} tamamlanan maç</p>
                  </div>
                </div>
                {recentCompleted.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-3xl mb-2">📋</p>
                    <p className="text-sm">Henüz tamamlanan maç yok</p>
                    <p className="text-xs mt-1">Skor girdiğinizde burada görünür</p>
                  </div>
                ) : (
                  <div className="space-y-3">{recentCompleted.map(m => <MiniMatchCard key={m.id} match={m} />)}</div>
                )}
              </div>
            </div>

            {nextUpcoming.length > 0 && upcoming24h.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-lg">📅</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Sonraki Maçlar</h3>
                    <p className="text-sm text-gray-500">Turnuvanın yaklaşan maçları</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nextUpcoming.map(m => <MiniMatchCard key={m.id} match={m} />)}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Tarih Seç</h3>
              <DaySelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                Maçlar — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {getMatchesByDate(selectedDate).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">⚽</div>
                  <p className="text-gray-500 text-lg">Bu tarih için maç bulunmuyor</p>
                </div>
              ) : (
                getMatchesByDate(selectedDate).map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predictions[match.id] || null}
                    onScoreUpdate={handleScoreUpdate}
                    onClearScore={handleClearScore}
                    onPredict={user ? handlePredict : undefined}
                    onNotify={handleNotify}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">📊</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Grup Puan Durumu</h2>
                <p className="text-gray-500">Takımların durumunu takip edin</p>
              </div>
            </div>
            <GroupStandings selectedGroup={selectedGroup} onGroupChange={setSelectedGroup} matches={matches} />
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl">🎯</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Tahminlerim</h2>
                <p className="text-gray-500">Maç sonuçlarını tahmin edin ve skorlarıyla karşılaştırın</p>
              </div>
            </div>

            {!user ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
                <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">👤</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Giriş Yapın</h3>
                <p className="text-gray-500 mb-6">Tahmin yapmak için giriş yapmanız gerekiyor</p>
                <a href="/auth/login" className="btn-primary inline-block px-8 py-3">Giriş Yap</a>
              </div>
            ) : (
              <>
                {Object.keys(predictions).length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Tahmin İstatistikleri</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-blue-600">{stats.predictionsCount}</p>
                        <p className="text-sm text-blue-700">Toplam Tahmin</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-emerald-600">{predStats.exact}</p>
                        <p className="text-sm text-emerald-700">Tam isabet</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-amber-600">{predStats.close}</p>
                        <p className="text-sm text-amber-700">Yakın Tahmin</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-red-600">{predStats.missed}</p>
                        <p className="text-sm text-red-700">Isabet Yok</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {Object.keys(predictions).length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
                      <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">🎯</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Tahmin Yok</h3>
                      <p className="text-gray-500">Fikstür sekmesinden maçlar için tahmin yapın!</p>
                    </div>
                  ) : (
                    matches.filter(m => predictions[m.id]).map(match => {
                      const pred = predictions[match.id];
                      const homeTeam = getTeam(match.homeTeamId);
                      const awayTeam = getTeam(match.awayTeamId);
                      return (
                        <div key={match.id} className="match-card">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`stage-badge border ${match.stage === 'Grup' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{match.stage}</span>
                            {match.group && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{match.group}. Grup</span>}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <img src={homeTeam.flag} alt={homeTeam.name} className="w-10 h-7 rounded object-cover" />
                              <span className="font-semibold text-gray-900">{homeTeam.name}</span>
                            </div>
                            <div className="text-center px-4">
                              {match.isCompleted ? (
                                <div>
                                  <div className="text-2xl font-black text-gray-900">{match.homeScore} - {match.awayScore}</div>
                                  <div className="text-xs text-gray-500 mt-1">Gerçek Skor</div>
                                </div>
                              ) : (
                                <div className="text-sm font-medium text-gray-500">Henüz oynanmadı</div>
                              )}
                              <div className="text-sm font-bold text-amber-600 mt-1">🎯 {pred.homeScore} - {pred.awayScore}</div>
                            </div>
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <span className="font-semibold text-gray-900">{awayTeam.name}</span>
                              <img src={awayTeam.flag} alt={awayTeam.name} className="w-10 h-7 rounded object-cover" />
                            </div>
                          </div>
                          {match.isCompleted && (() => {
                            const isExact = pred.homeScore === match.homeScore && pred.awayScore === match.awayScore;
                            const isClose = !isExact && (pred.homeScore === match.homeScore || pred.awayScore === match.awayScore || (pred.homeScore - pred.awayScore === match.homeScore! - match.awayScore!));
                            return (
                              <div className="mt-3 flex items-center justify-center">
                                {isExact && <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full">✓ Tam isabet!</span>}
                                {isClose && !isExact && <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full">~ Yakın tahmin</span>}
                                {!isExact && !isClose && <span className="text-sm font-semibold text-red-600 bg-red-50 px-4 py-1.5 rounded-full">✗ Isabet yok</span>}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">🔔</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Bildirimlerim</h2>
                <p className="text-gray-500">Maçları kaçırmayın!</p>
              </div>
            </div>
            <NotificationsList />
          </div>
        )}
      </main>

      <footer className="mt-16 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🏆</span>
            <span className="font-bold text-gray-900">FIFA Dünya Kupası 2026</span>
          </div>
          <p className="text-sm text-gray-500">Fikstür Takip</p>
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
    </div>
  );
}