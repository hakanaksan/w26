'use client';

import { groups, teams } from '@/data/teams';
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
    const groupTeams = teams.filter(t => t.groupId === groupId);
    const groupMatches = matches.filter(m => m.group === groupId && m.isCompleted);

    const standings: Record<string, Standing> = {};

    groupTeams.forEach(team => {
      standings[team.id] = {
        teamId: team.id,
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
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {groups.map(group => (
          <button
            key={group.id}
            onClick={() => onGroupChange(group.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[48px] ${
              selectedGroup === group.id
                ? 'bg-fifa-gold text-fifa-dark'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {group.id}
          </button>
        ))}
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500">
              <th className="text-left py-3 px-4">Team</th>
              <th className="text-center py-3 px-2">P</th>
              <th className="text-center py-3 px-2">W</th>
              <th className="text-center py-3 px-2">D</th>
              <th className="text-center py-3 px-2">L</th>
              <th className="text-center py-3 px-2">GF</th>
              <th className="text-center py-3 px-2">GA</th>
              <th className="text-center py-3 px-2">GD</th>
              <th className="text-center py-3 px-4">Pts</th>
            </tr>
          </thead>
          <tbody>
            {calculateStandings(selectedGroup).map((standing, index) => {
              const team = teams.find(t => t.id === standing.teamId);
              const isQualified = index < 2;

              return (
                <tr
                  key={standing.teamId}
                  className={`border-b border-gray-800/50 ${
                    isQualified ? 'bg-green-500/5' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{team?.flag}</span>
                      <span className="font-medium text-white">{team?.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 text-gray-400">{standing.played}</td>
                  <td className="text-center py-3 px-2 text-gray-400">{standing.won}</td>
                  <td className="text-center py-3 px-2 text-gray-400">{standing.drawn}</td>
                  <td className="text-center py-3 px-2 text-gray-400">{standing.lost}</td>
                  <td className="text-center py-3 px-2 text-gray-400">{standing.goalsFor}</td>
                  <td className="text-center py-3 px-2 text-gray-400">{standing.goalsAgainst}</td>
                  <td className="text-center py-3 px-2 text-gray-400">
                    {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                  </td>
                  <td className="text-center py-3 px-4 font-bold text-fifa-gold">{standing.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500/20 rounded"></div>
          <span>Qualifies for Round of 32</span>
        </div>
      </div>
    </div>
  );
}
