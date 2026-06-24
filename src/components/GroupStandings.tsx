'use client';

import { groups, teams, getTeam, getFlagUrl } from '@/data/teams';
import Link from 'next/link';
import type { Match } from '@/data/fixtures';

interface GroupStandingsProps {
  selectedGroup: string;
  onGroupChange: (group: string) => void;
  matches: Match[];
}

interface Standing {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export default function GroupStandings({ selectedGroup, onGroupChange, matches }: GroupStandingsProps) {
  const hasLiveMatch = matches.some(m => m.group === selectedGroup && !m.isCompleted && m.homeScore !== undefined && m.awayScore !== undefined);

  const calculateStandings = (groupId: string): Standing[] => {
    const groupTeamIds = Object.entries(teams)
      .filter(([, team]) => team.groupId === groupId)
      .map(([id]) => id);

    const groupMatches = matches.filter(m => m.group === groupId && m.homeScore !== undefined && m.awayScore !== undefined);

    const standings: Record<string, Standing> = {};
    groupTeamIds.forEach(teamId => {
      standings[teamId] = {
        teamId, played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
      };
    });

    groupMatches.forEach(match => {
      if (match.homeScore === undefined || match.awayScore === undefined) return;
      const home = standings[match.homeTeamId];
      const away = standings[match.awayTeamId];
      if (!home || !away) return;

      home.played++; away.played++;
      home.goalsFor += match.homeScore; home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore; away.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) { home.won++; home.points += 3; away.lost++; }
      else if (match.homeScore < match.awayScore) { away.won++; away.points += 3; home.lost++; }
      else { home.drawn++; away.drawn++; home.points++; away.points++; }
    });

    Object.values(standings).forEach(s => { s.goalDifference = s.goalsFor - s.goalsAgainst; });

    return Object.values(standings).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  };

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {groups.map(group => (
          <button key={group.id} onClick={() => onGroupChange(group.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${selectedGroup === group.id ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/40' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}>
            {group.name}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="text-left py-4 px-4">#</th>
                <th className="text-left py-4 px-4">Takım</th>
                <th className="text-center py-4 px-2">O</th>
                <th className="text-center py-4 px-2">G</th>
                <th className="text-center py-4 px-2">B</th>
                <th className="text-center py-4 px-2">M</th>
                <th className="text-center py-4 px-2">AG</th>
                <th className="text-center py-4 px-2">YG</th>
                <th className="text-center py-4 px-2">AV</th>
                <th className="text-center py-4 px-4">Puan</th>
              </tr>
            </thead>
            <tbody>
              {calculateStandings(selectedGroup).map((standing, index) => {
                const team = getTeam(standing.teamId);
                const isQualified = index < 2;
                return (
                  <tr key={standing.teamId} className={`border-b border-gray-100 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${isQualified ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                    <td className="py-4 px-4">
                       <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${isQualified ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{index + 1}</div>
                    </td>
                    <td className="py-4 px-4">
                      <Link href={`/team/${standing.teamId}`} className="flex items-center gap-3 group">
                        <img src={team.flag || getFlagUrl(standing.teamId)} alt={team.name} className="w-8 h-6 rounded object-cover group-hover:opacity-80 transition-opacity" />
                        <span className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{team.name}</span>
                      </Link>
                    </td>
                    <td className="text-center py-4 px-2 text-gray-600 dark:text-gray-300 font-medium">{standing.played}</td>
                    <td className="text-center py-4 px-2 text-gray-600 dark:text-gray-300">{standing.won}</td>
                    <td className="text-center py-4 px-2 text-gray-600 dark:text-gray-300">{standing.drawn}</td>
                    <td className="text-center py-4 px-2 text-gray-600 dark:text-gray-300">{standing.lost}</td>
                    <td className="text-center py-4 px-2 text-gray-600 dark:text-gray-300">{standing.goalsFor}</td>
                    <td className="text-center py-4 px-2 text-gray-600 dark:text-gray-300">{standing.goalsAgainst}</td>
                    <td className="text-center py-4 px-2 font-medium"><span className={standing.goalDifference > 0 ? 'text-emerald-600 dark:text-emerald-400' : standing.goalDifference < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}>{standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}</span></td>
                    <td className="text-center py-4 px-4"><span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{standing.points}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800" /> <span>Son 32'ye yükselir</span></div>
        {hasLiveMatch && (
          <div className="flex items-center gap-2">
            <span className="relative flex w-2.5 h-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">Canlı maç sonuçları puan tablosuna yansıyor</span>
          </div>
        )}
      </div>
    </div>
  );
}