'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import { matches as allMatches } from '@/data/fixtures';
import { getTeam, getFlagUrl, groups, teams as allTeams } from '@/data/teams';
import { useLiveScores } from '@/hooks/useLiveScores';

export default function TeamPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const team = getTeam(code);
  const groupInfo = groups.find(g => g.id === team.groupId);
  const teamMatches = allMatches.filter(m => m.homeTeamId === code || m.awayTeamId === code);

  const [localMatches, setLocalMatches] = useState(allMatches);
  const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({});
  const [activeTab, setActiveTab] = useState('fixtures');

  const { mergedMatches: matches } = useLiveScores(localMatches);
  const teamLiveMatches = matches.filter(m => m.homeTeamId === code || m.awayTeamId === code);

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();

    if (token) {
      fetch('/api/predictions', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : { predictions: {} })
        .then(data => setPredictions(data.predictions || {}))
        .catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    fetch('/api/scores').then(r => r.ok ? r.json() : { scores: {} }).then(data => {
      const scores: Record<string, { homeScore: number; awayScore: number; isCompleted: boolean }> = data.scores || {};
      if (Object.keys(scores).length > 0) {
        const updated = allMatches.map(m => {
          const s = scores[m.id];
          if (s) return { ...m, homeScore: s.homeScore, awayScore: s.awayScore, isCompleted: s.isCompleted };
          return m;
        });
        setLocalMatches(updated);
      }
    }).catch(() => {});
  }, []);

  const completedMatches = teamLiveMatches.filter(m => m.isCompleted || m.homeScore !== undefined);
  const upcomingMatches = teamLiveMatches.filter(m => !m.isCompleted && m.homeScore === undefined);
  const groupTeams = Object.entries(allTeams).filter(([, t]) => t.groupId === team.groupId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getStageStyle = (stage: string) => {
    switch (stage) {
      case 'Final': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Yarı Final': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Çeyrek Final': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Son 16': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Son 32': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Üçüncülük': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (code === 'TBD' || !team.flag) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header activeTab="fixtures" onTabChange={() => {}} />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Takım bulunamadı.</p>
          <button onClick={() => router.push('/')} className="btn-primary mt-4">Ana Sayfaya Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header activeTab="fixtures" onTabChange={() => router.push('/')} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 mb-8">
          <div className="flex items-center gap-6">
            <img src={team.flag} alt={team.name} className="w-24 h-16 rounded-xl shadow-lg object-cover" />
            <div>
              <h1 className="text-3xl font-black">{team.name}</h1>
              {groupInfo && <p className="text-blue-200 mt-1">{groupInfo.name}</p>}
              <p className="text-blue-200 text-sm mt-1">{completedMatches.length} oynanmış • {upcomingMatches.length} kalan maç</p>
            </div>
          </div>
        </div>

        {groupInfo && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
            <h3 className="font-bold text-gray-900 mb-4">{groupInfo.name} Takımları</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {groupTeams.map(([code, t]) => (
                <button
                  key={code}
                  onClick={() => router.push(`/team/${code}`)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${code === params.code ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border border-gray-200 hover:border-blue-300'}`}
                >
                  <img src={t.flag} alt={t.name} className="w-8 h-6 rounded object-cover" />
                  <span className="font-medium text-sm text-gray-900">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setActiveTab('fixtures')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'fixtures' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Tüm Maçlar ({teamLiveMatches.length})
          </button>
          <button onClick={() => setActiveTab('completed')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'completed' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Biten ({completedMatches.length})
          </button>
          <button onClick={() => setActiveTab('upcoming')} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'upcoming' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            Yaklaşan ({upcomingMatches.length})
          </button>
        </div>

        <div className="space-y-4">
          {(activeTab === 'fixtures' ? teamLiveMatches : activeTab === 'completed' ? completedMatches : upcomingMatches).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">⚽</div>
              <p className="text-gray-500 text-lg">Bu kategoride maç yok</p>
            </div>
          ) : (
            (activeTab === 'fixtures' ? teamLiveMatches : activeTab === 'completed' ? completedMatches : upcomingMatches)
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(match => {
                const homeTeam = getTeam(match.homeTeamId);
                const awayTeam = getTeam(match.awayTeamId);
                const pred = predictions[match.id];
                const isCompleted = match.isCompleted || match.homeScore !== undefined;
                const isTeamHome = match.homeTeamId === code;

                return (
                  <div key={match.id} className="match-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`stage-badge border ${getStageStyle(match.stage)}`}>{match.stage}</span>
                      {match.group && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{match.group}. Grup</span>}
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 flex-1">
                        <img src={homeTeam.flag || getFlagUrl(match.homeTeamId)} alt={homeTeam.name} className="w-12 h-8 rounded object-cover" onClick={() => match.homeTeamId !== 'TBD' && router.push(`/team/${match.homeTeamId}`)} />
                        <button onClick={() => match.homeTeamId !== 'TBD' && router.push(`/team/${match.homeTeamId}`)} className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors text-left">{homeTeam.name}</button>
                      </div>
                      <div className="px-4 flex-shrink-0">
                        {isCompleted ? (
                          <div className="text-center">
                            <p className="text-2xl font-black text-gray-900">{match.homeScore} - {match.awayScore}</p>
                            <p className="text-xs text-emerald-600 font-medium mt-1">Maç Bitti</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-xl font-bold text-blue-600">{match.time}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">TR</span>
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <button onClick={() => match.awayTeamId !== 'TBD' && router.push(`/team/${match.awayTeamId}`)} className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors text-right">{awayTeam.name}</button>
                        <img src={awayTeam.flag || getFlagUrl(match.awayTeamId)} alt={awayTeam.name} className="w-12 h-8 rounded object-cover" onClick={() => match.awayTeamId !== 'TBD' && router.push(`/team/${match.awayTeamId}`)} />
                      </div>
                    </div>

                    {isCompleted && pred && (
                      <div className="mb-3 px-3 py-2 rounded-lg flex items-center justify-between text-sm border">
                        <span className="font-medium">🎯 Tahminin:</span>
                        <div className="flex items-center gap-2">
                          <span className={pred.homeScore === match.homeScore && pred.awayScore === match.awayScore ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                            {pred.homeScore} - {pred.awayScore}
                          </span>
                          {pred.homeScore === match.homeScore && pred.awayScore === match.awayScore ? (
                            <span className="text-green-600 text-xs font-medium bg-green-100 px-2 py-0.5 rounded">✓ Tam isabet!</span>
                          ) : pred.homeScore === match.homeScore || pred.awayScore === match.awayScore ? (
                            <span className="text-yellow-600 text-xs font-medium bg-yellow-100 px-2 py-0.5 rounded">~ Yakın</span>
                          ) : (
                            <span className="text-red-500 text-xs font-medium bg-red-100 px-2 py-0.5 rounded">✗ Isabet yok</span>
                          )}
                        </div>
                      </div>
                    )}

                    {!isCompleted && pred && (
                      <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-sm">
                        <span className="text-amber-700 font-medium">🎯 Tahminin:</span>
                        <span className="font-bold text-amber-800">{pred.homeScore} - {pred.awayScore}</span>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {formatDate(match.date)}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-gray-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {match.time} <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">TR</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="text-gray-700 font-medium">{match.venue}</span>
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-600">{match.city}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-700 font-semibold">{match.country}</span>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => router.push('/')} className="btn-secondary px-8 py-3">
            ← Ana Sayfaya Dön
          </button>
        </div>
      </main>
    </div>
  );
}