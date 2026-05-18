'use client';

import { groups, teams, getTeam } from '@/data/teams';
import { matches } from '@/data/fixtures';

interface GroupStandingsProps {
  selectedGroup: string;
  onGroupChange: (group: string) => void;
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

export default function GroupStandings({ selectedGroup, onGroupChange }: GroupStandingsProps) {
  const calculateStandings = (groupId: string): Standing[] => {
    const groupTeams = Object.entries(teams)
      .filter(([, team]) => team.groupId === groupId)
      .map(([id]) => id);

    const groupMatches = matches.filter(m => m.group === groupId && m.isCompleted);

    const standings: Record<string, Standing> = {};

    groupTeams.forEach(teamId => {
      standings[teamId] = {
        teamId,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };
    });

    groupMatches.forEach(match => {
      if (match.homeScore === undefined || match.awayScore === undefined) return;

      const home = standings[match.homeTeamId];
      const away = standings[match.awayTeamId];

      if (!home || !away) return;

      home.played++;
      away.played++;
      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        home.won++;
        home.points += 3;
        away.lost++;
      } else if (match.homeScore < match.awayScore) {
        away.won++;
        away.points += 3;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;
        home.points += 1;
        away.points += 1;
      }
    });

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
          <button
            key={group.id}
            onClick={() => onGroupChange(group.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              selectedGroup === group.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="text-left py-4 px-4">#</th>
                <th className="text-left py-4 px-4">Takım</th>
                <th className="text-center py-4 px-3">O</th>
                <th className="text-center py-4 px-3">G</th>
                <th className="text-center py-4 px-3">B</th>
                <th className="text-center py-4 px-3">M</th>
                <th className="text-center py-4 px-3">AG</th>
                <th className="text-center py-4 px-3">YG</th>
                <th className="text-center py-4 px-3">AV</th>
                <th className="text-center py-4 px-4">Puan</th>
              </tr>
            </thead>
            <tbody>
              {calculateStandings(selectedGroup).map((standing, index) => {
                const team = getTeam(standing.teamId);
                const isQualified = index < 2;
                const isEliminated = index >= 2;

                return (
                  <tr
                    key={standing.teamId}
                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                      isQualified ? 'bg-emerald-50/50' : isEliminated ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isQualified ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
                          {team.flag}
                        </div>
                        <span className="font-semibold text-gray-900">{team.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-3 text-gray-600 font-medium">{standing.played}</td>
                    <td className="text-center py-4 px-3 text-gray-600">{standing.won}</td>
                    <td className="text-center py-4 px-3 text-gray-600">{standing.drawn}</td>
                    <td className="text-center py-4 px-3 text-gray-600">{standing.lost}</td>
                    <td className="text-center py-4 px-3 text-gray-600">{standing.goalsFor}</td>
                    <td className="text-center py-4 px-3 text-gray-600">{standing.goalsAgainst}</td>
                    <td className="text-center py-4 px-3 font-medium">
                      <span className={standing.goalDifference > 0 ? 'text-emerald-600' : standing.goalDifference < 0 ? 'text-red-600' : 'text-gray-500'}>
                        {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="text-lg font-black text-blue-600">{standing.points}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-100 rounded-lg border border-emerald-200"></div>
          <span>Son 32'ye yükselir</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 rounded-lg border border-red-200"></div>
          <span>Elendi</span>
        </div>
      </div>
    </div>
  );
}
