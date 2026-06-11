'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import { matches as allMatches } from '@/data/fixtures';
import { getTeam, getFlagUrl, groups, teams as allTeams, TeamInfo } from '@/data/teams';
import { useLiveScores } from '@/hooks/useLiveScores';
import { getMatchStatus } from '@/lib/match-status';

export default function TeamPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const team = getTeam(code);
  const groupInfo = groups.find(g => g.id === team.groupId);
  const groupTeams = Object.entries(allTeams).filter(([, t]) => t.groupId === team.groupId);

  const [localMatches, setLocalMatches] = useState(allMatches);
  const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({});
  const [activeTab, setActiveTab] = useState('overview');

  const { mergedMatches: matches } = useLiveScores(localMatches);
  const teamMatches = matches.filter(m => m.homeTeamId === code || m.awayTeamId === code);

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

const completedMatches = teamMatches.filter(m => getMatchStatus(m).hasScore);
const upcomingMatches = teamMatches.filter(m => !getMatchStatus(m).hasScore);

  const goalsFor = completedMatches.reduce((sum, m) => {
    return sum + (m.homeTeamId === code ? (m.homeScore || 0) : (m.awayScore || 0));
  }, 0);
  const goalsAgainst = completedMatches.reduce((sum, m) => {
    return sum + (m.homeTeamId === code ? (m.awayScore || 0) : (m.homeScore || 0));
  }, 0);
  const wins = completedMatches.filter(m => {
    const isHome = m.homeTeamId === code;
    return isHome ? (m.homeScore || 0) > (m.awayScore || 0) : (m.awayScore || 0) > (m.homeScore || 0);
  }).length;
  const draws = completedMatches.filter(m => m.homeScore === m.awayScore).length;
  const losses = completedMatches.length - wins - draws;

  const standings = groupTeams.map(([, t]) => {
    const tMatches = matches.filter(m => (m.homeTeamId === t.code || m.awayTeamId === t.code) && m.group === team.groupId && getMatchStatus(m).hasScore);
    let pts = 0, gf = 0, ga = 0, w = 0, d = 0, l = 0;
    tMatches.forEach(m => {
      const isHome = m.homeTeamId === t.code;
      const scored = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
      const conceded = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
      gf += scored; ga += conceded;
      if (scored > conceded) { w++; pts += 3; }
      else if (scored === conceded) { d++; pts += 1; }
      else { l++; }
    });
    return { ...t, pts, gf, ga, w, d, l, played: tMatches.length };
  }).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);

  const teamStanding = standings.findIndex(s => s.code === code) + 1;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getStageStyle = (stage: string) => {
    switch (stage) {
      case 'Final': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Yarı Final': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Çeyrek Final': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Son 16': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Son 32': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'Üçüncülük': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  if (code === 'TBD' || !team.flag) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header activeTab="fixtures" onTabChange={() => {}} />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">Takım bulunamadı.</p>
          <button onClick={() => router.push('/')} className="btn-primary mt-4">Ana Sayfaya Dön</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Genel Bakış' },
    { id: 'squad', label: 'Kadro' },
    { id: 'matches', label: 'Maçlar' },
    { id: 'group', label: 'Grup' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header activeTab="fixtures" onTabChange={() => router.push('/')} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative rounded-3xl overflow-hidden mb-8 shadow-xl" style={{ background: `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.primary}dd, ${team.colors.secondary}88)` }}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-16 bg-white/20 backdrop-blur-sm rounded-2xl p-1 flex items-center justify-center">
                <img src={team.flag} alt={team.name} className="w-full h-full rounded-xl object-cover" />
              </div>
              <div>
                <h1 className="text-3xl font-black">{team.name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {groupInfo && <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">{groupInfo.name}</span>}
                  {teamStanding > 0 && <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">Grup {teamStanding}. sıra</span>}
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">FIFA #{team.ranking}</span>
                </div>
                {team.coach && <p className="text-white/80 text-sm mt-1">Teknik Direktör: {team.coach}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                <p className="text-2xl font-black">{completedMatches.length}</p>
                <p className="text-white/70 text-xs">Oynanan</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                <p className="text-2xl font-black">{wins}</p>
                <p className="text-white/70 text-xs">Galibiyet</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                <p className="text-2xl font-black">{goalsFor}</p>
                <p className="text-white/70 text-xs">Atılan Gol</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                <p className="text-2xl font-black">{goalsAgainst}</p>
                <p className="text-white/70 text-xs">Yenilen Gol</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/50' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {completedMatches.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Sonuçlar</h3>
                <div className="space-y-3">
                  {completedMatches.sort((a, b) => b.date.localeCompare(a.date)).map(match => {
                    const homeTeam = getTeam(match.homeTeamId);
                    const awayTeam = getTeam(match.awayTeamId);
                    const isHome = match.homeTeamId === code;
                    const teamScore = isHome ? match.homeScore : match.awayScore;
                    const oppScore = isHome ? match.awayScore : match.homeScore;
                    const result = teamScore! > oppScore! ? 'G' : teamScore! < oppScore! ? 'M' : 'B';
                    const resultColor = result === 'G' ? 'bg-emerald-500' : result === 'M' ? 'bg-red-500' : 'bg-amber-500';
                    return (
                      <button key={match.id} onClick={() => router.push(`/match/${match.id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${resultColor}`}>{result}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{isHome ? awayTeam.name : homeTeam.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{isHome ? 'Ev' : 'Deplasman'} • {formatDate(match.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-gray-900 dark:text-white">{match.homeScore} - {match.awayScore}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {upcomingMatches.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Yaklaşan Maçlar</h3>
                <div className="space-y-3">
                  {upcomingMatches.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5).map(match => {
                    const opp = match.homeTeamId === code ? getTeam(match.awayTeamId) : getTeam(match.homeTeamId);
                    const isHome = match.homeTeamId === code;
                    return (
                      <button key={match.id} onClick={() => router.push(`/match/${match.id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
                        <img src={opp.flag || getFlagUrl(match.homeTeamId === code ? match.awayTeamId : match.homeTeamId)} alt={opp.name} className="w-10 h-7 rounded object-cover" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{isHome ? 'Ev' : 'Deplasman'}: {opp.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(match.date)} • {match.time} TR</p>
                        </div>
                        <span className={`stage-badge border text-xs ${getStageStyle(match.stage)}`}>{match.stage}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {completedMatches.length === 0 && upcomingMatches.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">⚽</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Henüz maç verisi yok</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'squad' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: team.colors.primary + '22' }}>
                👕
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Kadro</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{team.name} • {team.squad.length} oyuncu</p>
              </div>
            </div>
            {team.squad.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {team.squad.map((player, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: team.colors.primary }}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{player}</span>
                    {i === 0 && <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">GK</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Kadro bilgisi mevcut değil</p>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setActiveTab('matches')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">Tümü ({teamMatches.length})</button>
            </div>
            {teamMatches.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">⚽</div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Maç bulunmuyor</p>
              </div>
            ) : (
              teamMatches.sort((a, b) => a.date.localeCompare(b.date)).map(match => {
                const homeTeam = getTeam(match.homeTeamId);
                const awayTeam = getTeam(match.awayTeamId);
const { hasScore, isCompleted: matchCompleted, isLive: matchLive } = getMatchStatus(match);
                 return (
                  <button key={match.id} onClick={() => router.push(`/match/${match.id}`)} className="w-full text-left match-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`stage-badge border ${getStageStyle(match.stage)}`}>{match.stage}</span>
                      {match.group && <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{match.group}. Grup</span>}
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 flex-1">
                        <img src={homeTeam.flag || getFlagUrl(match.homeTeamId)} alt={homeTeam.name} className="w-12 h-8 rounded object-cover" />
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{homeTeam.name}</span>
                      </div>
                      <div className="px-4 flex-shrink-0">
{hasScore ? (
                           <div className="text-center">
                             <p className="text-2xl font-black text-gray-900 dark:text-white">{match.homeScore} - {match.awayScore}</p>
                             {matchCompleted ? (
                               <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Maç Bitti</p>
                             ) : matchLive ? (
                               <p className="text-xs text-red-600 dark:text-red-400 font-bold mt-1">CANLI</p>
                             ) : (
                               <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Skor girildi</p>
                             )}
                           </div>
                         ) : (
                          <div className="text-center">
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{match.time}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">TR</span>
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{awayTeam.name}</span>
                        <img src={awayTeam.flag || getFlagUrl(match.awayTeamId)} alt={awayTeam.name} className="w-12 h-8 rounded object-cover" />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>{formatDate(match.date)}</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{match.venue}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'group' && groupInfo && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">{groupInfo.name} Puan Durumu</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="text-left py-3 px-4">#</th>
                      <th className="text-left py-3 px-4">Takım</th>
                      <th className="text-center py-3 px-2">O</th>
                      <th className="text-center py-3 px-2">G</th>
                      <th className="text-center py-3 px-2">B</th>
                      <th className="text-center py-3 px-2">M</th>
                      <th className="text-center py-3 px-2">AG</th>
                      <th className="text-center py-3 px-2">YG</th>
                      <th className="text-center py-3 px-2">Averaj</th>
                      <th className="text-center py-3 px-4">Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, i) => (
                      <tr key={team.code} className={`border-t border-gray-100 dark:border-gray-700 ${team.code === code ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                        <td className="py-3 px-4">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${i < 2 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => router.push(`/team/${team.code}`)} className="flex items-center gap-2 group">
                            <img src={team.flag} alt={team.name} className="w-7 h-5 rounded object-cover" />
                            <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 text-sm">{team.name}</span>
                          </button>
                        </td>
                        <td className="text-center py-3 px-2 text-sm text-gray-600 dark:text-gray-300">{team.played}</td>
                        <td className="text-center py-3 px-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">{team.w}</td>
                        <td className="text-center py-3 px-2 text-sm text-amber-600 dark:text-amber-400">{team.d}</td>
                        <td className="text-center py-3 px-2 text-sm text-red-500 dark:text-red-400">{team.l}</td>
                        <td className="text-center py-3 px-2 text-sm text-gray-600 dark:text-gray-300">{team.gf}</td>
                        <td className="text-center py-3 px-2 text-sm text-gray-600 dark:text-gray-300">{team.ga}</td>
                        <td className="text-center py-3 px-2 text-sm font-medium">{team.gf - team.ga > 0 ? `+${team.gf - team.ga}` : team.gf - team.ga}</td>
                        <td className="text-center py-3 px-4 text-sm font-black text-blue-600 dark:text-blue-400">{team.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {groupTeams.map(([, t]) => (
                <button key={t.code} onClick={() => router.push(`/team/${t.code}`)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${t.code === code ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'}`}>
                  <img src={t.flag} alt={t.name} className="w-8 h-6 rounded object-cover" />
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{t.name}</span>
                </button>
              ))}
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