import { matches as allMatches, Match } from './fixtures';
import { teams as allTeams, getTeam } from './teams';
import combinationsData from './combinations.json';

export interface GroupStanding {
  code: string;
  name: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export function calculateGroupStandings(
  matchData: Match[],
  predictions: Record<string, { homeScore: number; awayScore: number; homePenaltyScore?: number; awayPenaltyScore?: number }> = {}
): Record<string, GroupStanding[]> {
  const groups: Record<string, GroupStanding[]> = {};

  for (const code of Object.keys(allTeams)) {
    const team = allTeams[code];
    if (!groups[team.groupId]) groups[team.groupId] = [];
    groups[team.groupId].push({
      code,
      name: team.name,
      flag: team.flag,
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0,
    });
  }

  for (const m of matchData) {
    if (!m.group) continue;

    let homeScore: number | undefined;
    let awayScore: number | undefined;

    if (m.homeScore !== undefined && m.awayScore !== undefined) {
      homeScore = m.homeScore;
      awayScore = m.awayScore;
    } else if (predictions[m.id]) {
      homeScore = predictions[m.id].homeScore;
      awayScore = predictions[m.id].awayScore;
    } else {
      continue;
    }

    const homeGroup = groups[m.group];
    if (!homeGroup) continue;

    const home = homeGroup.find(t => t.code === m.homeTeamId);
    const away = homeGroup.find(t => t.code === m.awayTeamId);
    if (!home || !away) continue;

    home.played++; away.played++;
    home.gf += homeScore; home.ga += awayScore;
    away.gf += awayScore; away.ga += homeScore;

    if (homeScore > awayScore) {
      home.won++; home.pts += 3; away.lost++;
    } else if (homeScore < awayScore) {
      away.won++; away.pts += 3; home.lost++;
    } else {
      home.drawn++; away.drawn++; home.pts += 1; away.pts += 1;
    }
  }

  for (const gid of Object.keys(groups)) {
    for (const team of groups[gid]) {
      team.gd = team.gf - team.ga;
    }
    groups[gid].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }

  return groups;
}

export interface BracketSlot {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  round: string;
  homeSource?: string;
  awaySource?: string;
  homeScore?: number;
  awayScore?: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  isCompleted?: boolean;
  winner?: string;
}

// 2026 World Cup Son 32 bracket — verified against Wikipedia 2026 FIFA World Cup knockout stage
// Format: 16 matches = 12 group winners + 12 runners-up + 8 best third-placed teams
// Per Wikipedia: 4 matches runner-up vs runner-up, 4 matches winner vs runner-up, 8 matches winner vs best 3rd
// 3rd-place assignments are dynamic (495 combinations) — here we use a static best-3rd mapping
const SON32_SLOTS: { matchId: string; homeSource: string; awaySource: string }[] = [
  { matchId: 'M073', homeSource: '2A', awaySource: '2B' },
  { matchId: 'M074', homeSource: '1E', awaySource: '3RD_1' },
  { matchId: 'M075', homeSource: '1F', awaySource: '2C' },
  { matchId: 'M076', homeSource: '1C', awaySource: '2F' },
  { matchId: 'M077', homeSource: '1I', awaySource: '3RD_2' },
  { matchId: 'M078', homeSource: '2E', awaySource: '2I' },
  { matchId: 'M079', homeSource: '1A', awaySource: '3RD_3' },
  { matchId: 'M080', homeSource: '1L', awaySource: '3RD_4' },
  { matchId: 'M081', homeSource: '1D', awaySource: '3RD_5' },
  { matchId: 'M082', homeSource: '1G', awaySource: '3RD_6' },
  { matchId: 'M083', homeSource: '2K', awaySource: '2L' },
  { matchId: 'M084', homeSource: '1H', awaySource: '2J' },
  { matchId: 'M101', homeSource: '1B', awaySource: '3RD_7' },
  { matchId: 'M102', homeSource: '1J', awaySource: '2H' },
  { matchId: 'M103', homeSource: '1K', awaySource: '3RD_8' },
  { matchId: 'M104', homeSource: '2D', awaySource: '2G' },
];

// Son 16 — Wikipedia Round of 16 subsections "Winner Match X vs Winner Match Y"
// Top half (SF1 path): M089 = M83+M84, M090 = M81+M82, M093 = M089+M090
// Bottom half (SF2 path): M091 = M86+M88, M092 = M85+M87, M095 = M091+M092
// Top half: M085 = M74+M77, M086 = M73+M75, M094 = M085+M086
// Bottom half: M087 = M76+M78, M088 = M79+M80, M096 = M087+M088
const SON16_SLOTS: { matchId: string; homeFrom: string; awayFrom: string }[] = [
  { matchId: 'M085', homeFrom: 'M074', awayFrom: 'M077' },
  { matchId: 'M086', homeFrom: 'M073', awayFrom: 'M075' },
  { matchId: 'M087', homeFrom: 'M076', awayFrom: 'M078' },
  { matchId: 'M088', homeFrom: 'M079', awayFrom: 'M080' },
  { matchId: 'M089', homeFrom: 'M083', awayFrom: 'M084' },
  { matchId: 'M090', homeFrom: 'M081', awayFrom: 'M082' },
  { matchId: 'M091', homeFrom: 'M102', awayFrom: 'M104' },
  { matchId: 'M092', homeFrom: 'M101', awayFrom: 'M103' },
];

const QF_SLOTS: { matchId: string; homeFrom: string; awayFrom: string }[] = [
  { matchId: 'M093', homeFrom: 'M085', awayFrom: 'M086' },
  { matchId: 'M094', homeFrom: 'M089', awayFrom: 'M090' },
  { matchId: 'M095', homeFrom: 'M087', awayFrom: 'M088' },
  { matchId: 'M096', homeFrom: 'M091', awayFrom: 'M092' },
];

const SF_SLOTS: { matchId: string; homeFrom: string; awayFrom: string }[] = [
  { matchId: 'M097', homeFrom: 'M093', awayFrom: 'M094' },
  { matchId: 'M098', homeFrom: 'M095', awayFrom: 'M096' },
];

const FINAL_SLOTS: { matchId: string; homeFrom: string; awayFrom: string }[] = [
  { matchId: 'M100', homeFrom: 'M097', awayFrom: 'M098' },
];

const THIRD_PLACE_SLOTS: { matchId: string; homeFrom: string; awayFrom: string }[] = [
  { matchId: 'M099', homeFrom: 'M097_L', awayFrom: 'M098_L' },
];

export function resolveBracket(
  matchData: Match[],
  predictions: Record<string, { homeScore: number; awayScore: number; homePenaltyScore?: number; awayPenaltyScore?: number }> = {}
): BracketSlot[] {
  const standings = calculateGroupStandings(matchData, predictions);
  const slots: BracketSlot[] = [];
  const winners: Record<string, string> = {};

  const groupPosition = (pos: string): string => {
    // format: '1A' (winner) or '2B' (runner-up) — position char first, group letter second
    const group = pos.charAt(1);
    const position = parseInt(pos.charAt(0));
    const groupTeams = standings[group];
    if (!groupTeams || !groupTeams[position - 1]) return 'TBD';
    return groupTeams[position - 1].code;
  };

  // Calculate 8 best 3rd-place teams
  const allThird: { code: string; pts: number; gd: number; gf: number; group: string }[] = [];
  for (const [groupId, teams] of Object.entries(standings)) {
    if (teams[2]) allThird.push({ code: teams[2].code, pts: teams[2].pts, gd: teams[2].gd, gf: teams[2].gf, group: groupId });
  }
  allThird.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

  const thirdPlaceMap: Record<string, string> = {};
  const qualifiedGroups = allThird.slice(0, 8).map(t => t.group).sort().join('');
  const mapping = (combinationsData as Record<string, Record<string, string>>)[qualifiedGroups];

  if (mapping) {
    thirdPlaceMap['3RD_1'] = standings[mapping['1E']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_2'] = standings[mapping['1I']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_3'] = standings[mapping['1A']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_4'] = standings[mapping['1L']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_5'] = standings[mapping['1D']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_6'] = standings[mapping['1G']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_7'] = standings[mapping['1B']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_8'] = standings[mapping['1K']]?.[2]?.code || 'TBD';
  } else {
    for (let i = 0; i < 8 && i < allThird.length; i++) {
      thirdPlaceMap[`3RD_${i + 1}`] = allThird[i].code;
    }
  }

  const resolvePosition = (pos: string): string => {
    if (pos.startsWith('3RD_')) return thirdPlaceMap[pos] || 'TBD';
    if (pos.length === 2 && pos[0] >= '1' && pos[0] <= '4') return groupPosition(pos);
    return 'TBD';
  };

  // Resolve Son 32
  for (const slot of SON32_SLOTS) {
    const homeTeam = resolvePosition(slot.homeSource);
    const awayTeam = resolvePosition(slot.awaySource);
    const pred = predictions[slot.matchId];
    let homeScore: number | undefined;
    let awayScore: number | undefined;
    let homePenaltyScore: number | undefined;
    let awayPenaltyScore: number | undefined;
    let isCompleted = false;
    let winner = 'TBD';

    const actual = matchData.find(m => m.id === slot.matchId);
    if (actual && actual.isCompleted && actual.homeScore !== undefined && actual.awayScore !== undefined) {
      homeScore = actual.homeScore;
      awayScore = actual.awayScore;
      homePenaltyScore = actual.homePenaltyScore;
      awayPenaltyScore = actual.awayPenaltyScore;
      isCompleted = true;
    } else if (pred && homeTeam !== 'TBD' && awayTeam !== 'TBD') {
      homeScore = pred.homeScore;
      awayScore = pred.awayScore;
      homePenaltyScore = pred.homePenaltyScore;
      awayPenaltyScore = pred.awayPenaltyScore;
    }

    if (homeScore !== undefined && awayScore !== undefined && homeTeam !== 'TBD' && awayTeam !== 'TBD') {
      if (homeScore > awayScore) {
        winner = homeTeam;
      } else if (homeScore < awayScore) {
        winner = awayTeam;
      } else {
        // Draw, check penalties
        if (homePenaltyScore !== undefined && awayPenaltyScore !== undefined) {
          if (homePenaltyScore > awayPenaltyScore) {
            winner = homeTeam;
          } else if (homePenaltyScore < awayPenaltyScore) {
            winner = awayTeam;
          } else {
            winner = homeTeam; // tie-breaker fallback
          }
        } else {
          winner = homeTeam; // fallback
        }
      }
      winners[slot.matchId] = winner;
    }

    slots.push({
      matchId: slot.matchId,
      homeTeamId: homeTeam,
      awayTeamId: awayTeam,
      round: 'Son 32',
      homeSource: slot.homeSource,
      awaySource: slot.awaySource,
      homeScore,
      awayScore,
      homePenaltyScore,
      awayPenaltyScore,
      isCompleted,
      winner,
    });
  }

  // Resolve Son 16, ÇF, YF, Final, 3rd Place
  const resolvePair = (
    matchId: string, homeFrom: string, awayFrom: string, round: string
  ) => {
    let homeTeam = 'TBD';
    let awayTeam = 'TBD';

    if (homeFrom.endsWith('_L')) {
      // Loser of a match
      const srcMatch = homeFrom.replace('_L', '');
      const srcSlot = slots.find(s => s.matchId === srcMatch);
      if (srcSlot && srcSlot.homeTeamId !== 'TBD' && srcSlot.awayTeamId !== 'TBD' && srcSlot.winner) {
        homeTeam = srcSlot.winner === srcSlot.homeTeamId ? srcSlot.awayTeamId : srcSlot.homeTeamId;
      }
    } else if (homeFrom.endsWith('_W')) {
      homeTeam = winners[homeFrom.replace('_W', '')] || 'TBD';
    } else if (homeFrom.startsWith('M')) {
      homeTeam = winners[homeFrom] || 'TBD';
    } else {
      homeTeam = resolvePosition(homeFrom);
    }

    if (awayFrom.endsWith('_L')) {
      const srcMatch = awayFrom.replace('_L', '');
      const srcSlot = slots.find(s => s.matchId === srcMatch);
      if (srcSlot && srcSlot.homeTeamId !== 'TBD' && srcSlot.awayTeamId !== 'TBD' && srcSlot.winner) {
        awayTeam = srcSlot.winner === srcSlot.homeTeamId ? srcSlot.awayTeamId : srcSlot.homeTeamId;
      }
    } else if (awayFrom.endsWith('_W')) {
      awayTeam = winners[awayFrom.replace('_W', '')] || 'TBD';
    } else if (awayFrom.startsWith('M')) {
      awayTeam = winners[awayFrom] || 'TBD';
    } else {
      awayTeam = resolvePosition(awayFrom);
    }

    const pred = predictions[matchId];
    let homeScore: number | undefined;
    let awayScore: number | undefined;
    let homePenaltyScore: number | undefined;
    let awayPenaltyScore: number | undefined;
    let isCompleted = false;
    let winner = 'TBD';

    const actual = matchData.find(m => m.id === matchId);
    if (actual && actual.isCompleted && actual.homeScore !== undefined && actual.awayScore !== undefined) {
      homeScore = actual.homeScore;
      awayScore = actual.awayScore;
      homePenaltyScore = actual.homePenaltyScore;
      awayPenaltyScore = actual.awayPenaltyScore;
      isCompleted = true;
    } else if (pred && homeTeam !== 'TBD' && awayTeam !== 'TBD') {
      homeScore = pred.homeScore;
      awayScore = pred.awayScore;
      homePenaltyScore = pred.homePenaltyScore;
      awayPenaltyScore = pred.awayPenaltyScore;
    }

    if (homeScore !== undefined && awayScore !== undefined && homeTeam !== 'TBD' && awayTeam !== 'TBD') {
      if (homeScore > awayScore) {
        winner = homeTeam;
      } else if (homeScore < awayScore) {
        winner = awayTeam;
      } else {
        // Draw, check penalties
        if (homePenaltyScore !== undefined && awayPenaltyScore !== undefined) {
          if (homePenaltyScore > awayPenaltyScore) {
            winner = homeTeam;
          } else if (homePenaltyScore < awayPenaltyScore) {
            winner = awayTeam;
          } else {
            winner = homeTeam; // tie-breaker fallback
          }
        } else {
          winner = homeTeam; // fallback
        }
      }
      winners[matchId] = winner;
    }

    slots.push({
      matchId,
      homeTeamId: homeTeam,
      awayTeamId: awayTeam,
      round,
      homeSource: homeFrom,
      awaySource: awayFrom,
      homeScore,
      awayScore,
      homePenaltyScore,
      awayPenaltyScore,
      isCompleted,
      winner,
    });
  };

  for (const s of SON16_SLOTS) resolvePair(s.matchId, s.homeFrom, s.awayFrom, 'Son 16');
  for (const s of QF_SLOTS) resolvePair(s.matchId, s.homeFrom, s.awayFrom, 'Çeyrek Final');
  for (const s of SF_SLOTS) resolvePair(s.matchId, s.homeFrom, s.awayFrom, 'Yarı Final');
  for (const s of FINAL_SLOTS) resolvePair(s.matchId, s.homeFrom, s.awayFrom, 'Final');
  for (const s of THIRD_PLACE_SLOTS) resolvePair(s.matchId, s.homeFrom, s.awayFrom, 'Üçüncülük');

  return slots;
}

export function isGroupComplete(groupId: string, matchData: Match[]): boolean {
  const groupMatches = matchData.filter(m => m.group === groupId);
  if (groupMatches.length < 6) return false;
  return groupMatches.every(m => m.isCompleted && m.homeScore !== undefined && m.awayScore !== undefined);
}

export function resolveRealBracket(matchData: Match[]): BracketSlot[] {
  const standings = calculateGroupStandings(matchData, {});
  const slots: BracketSlot[] = [];
  const winners: Record<string, string> = {};

  const groupPosition = (pos: string): string => {
    // format: '1A' (winner) or '2B' (runner-up) — position char first, group letter second
    const group = pos.charAt(1);
    const position = parseInt(pos.charAt(0));
    const groupTeams = standings[group];
    if (!groupTeams || !groupTeams[position - 1]) return 'TBD';
    return groupTeams[position - 1].code;
  };

  const allThird: { code: string; pts: number; gd: number; gf: number; group: string }[] = [];
  for (const [groupId, teams] of Object.entries(standings)) {
    if (teams[2]) allThird.push({ code: teams[2].code, pts: teams[2].pts, gd: teams[2].gd, gf: teams[2].gf, group: groupId });
  }
  allThird.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

  const thirdPlaceMap: Record<string, string> = {};
  const qualifiedGroups = allThird.slice(0, 8).map(t => t.group).sort().join('');
  const mapping = (combinationsData as Record<string, Record<string, string>>)[qualifiedGroups];

  if (mapping) {
    thirdPlaceMap['3RD_1'] = standings[mapping['1E']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_2'] = standings[mapping['1I']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_3'] = standings[mapping['1A']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_4'] = standings[mapping['1L']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_5'] = standings[mapping['1D']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_6'] = standings[mapping['1G']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_7'] = standings[mapping['1B']]?.[2]?.code || 'TBD';
    thirdPlaceMap['3RD_8'] = standings[mapping['1K']]?.[2]?.code || 'TBD';
  } else {
    for (let i = 0; i < 8 && i < allThird.length; i++) {
      thirdPlaceMap[`3RD_${i + 1}`] = allThird[i].code;
    }
  }

  const resolvePosition = (pos: string): string => {
    if (pos.startsWith('3RD_')) return thirdPlaceMap[pos] || 'TBD';
    if (pos.length === 2 && pos[0] >= '1' && pos[0] <= '4') return groupPosition(pos);
    return 'TBD';
  };

  for (const slot of SON32_SLOTS) {
    const homeTeam = resolvePosition(slot.homeSource);
    const awayTeam = resolvePosition(slot.awaySource);
    let homeScore: number | undefined;
    let awayScore: number | undefined;
    let isCompleted = false;
    let winner = 'TBD';

    const actual = matchData.find(m => m.id === slot.matchId);
    if (actual && actual.isCompleted && actual.homeScore !== undefined && actual.awayScore !== undefined) {
      homeScore = actual.homeScore;
      awayScore = actual.awayScore;
      isCompleted = true;
    }

    if (homeScore !== undefined && awayScore !== undefined && homeTeam !== 'TBD' && awayTeam !== 'TBD') {
      winner = homeScore > awayScore ? homeTeam : (homeScore < awayScore ? awayTeam : homeTeam);
      winners[slot.matchId] = winner;
    }

    slots.push({
      matchId: slot.matchId,
      homeTeamId: homeTeam,
      awayTeamId: awayTeam,
      round: 'Son 32',
      homeSource: slot.homeSource,
      awaySource: slot.awaySource,
      homeScore,
      awayScore,
      isCompleted,
      winner,
    });
  }

  const resolvePair = (matchId: string, homeFrom: string, awayFrom: string, round: string) => {
    let homeTeam = 'TBD';
    let awayTeam = 'TBD';

    if (homeFrom.endsWith('_L')) {
      const srcMatch = homeFrom.replace('_L', '');
      const srcSlot = slots.find(s => s.matchId === srcMatch);
      if (srcSlot && srcSlot.homeTeamId !== 'TBD' && srcSlot.awayTeamId !== 'TBD' && srcSlot.winner) {
        homeTeam = srcSlot.winner === srcSlot.homeTeamId ? srcSlot.awayTeamId : srcSlot.homeTeamId;
      }
    } else if (homeFrom.endsWith('_W')) {
      homeTeam = winners[homeFrom.replace('_W', '')] || 'TBD';
    } else if (homeFrom.startsWith('M')) {
      homeTeam = winners[homeFrom] || 'TBD';
    } else {
      homeTeam = resolvePosition(homeFrom);
    }

    if (awayFrom.endsWith('_L')) {
      const srcMatch = awayFrom.replace('_L', '');
      const srcSlot = slots.find(s => s.matchId === srcMatch);
      if (srcSlot && srcSlot.homeTeamId !== 'TBD' && srcSlot.awayTeamId !== 'TBD' && srcSlot.winner) {
        awayTeam = srcSlot.winner === srcSlot.homeTeamId ? srcSlot.awayTeamId : srcSlot.homeTeamId;
      }
    } else if (awayFrom.endsWith('_W')) {
      awayTeam = winners[awayFrom.replace('_W', '')] || 'TBD';
    } else if (awayFrom.startsWith('M')) {
      awayTeam = winners[awayFrom] || 'TBD';
    } else {
      awayTeam = resolvePosition(awayFrom);
    }

    let homeScore: number | undefined;
    let awayScore: number | undefined;
    let isCompleted = false;
    let winner = 'TBD';

    const actual = matchData.find(m => m.id === matchId);
    if (actual && actual.isCompleted && actual.homeScore !== undefined && actual.awayScore !== undefined) {
      homeScore = actual.homeScore;
      awayScore = actual.awayScore;
      isCompleted = true;
    }

    if (homeScore !== undefined && awayScore !== undefined && homeTeam !== 'TBD' && awayTeam !== 'TBD') {
      winner = homeScore > awayScore ? homeTeam : (homeScore < awayScore ? awayTeam : homeTeam);
      winners[matchId] = winner;
    }

    slots.push({
      matchId,
      homeTeamId: homeTeam,
      awayTeamId: awayTeam,
      round,
      homeSource: homeFrom,
      awaySource: awayFrom,
      homeScore,
      awayScore,
      isCompleted,
      winner,
    });
  };

  for (const s of SON16_SLOTS) resolvePair(s.matchId, s.homeFrom, s.awayFrom, 'Son 16');
  for (const s of QF_SLOTS) resolvePair(s.matchId, s.homeFrom, s.awayFrom, 'Çeyrek Final');
  for (const s of SF_SLOTS) resolvePair(s.matchId, s.homeFrom, s.awayFrom, 'Yarı Final');
  for (const s of FINAL_SLOTS) resolvePair(s.matchId, s.homeFrom, s.awayFrom, 'Final');
  for (const s of THIRD_PLACE_SLOTS) resolvePair(s.matchId, s.homeFrom, s.awayFrom, 'Üçüncülük');

  return slots;
}

export function getNextRoundMatch(matchId: string): string | null {
  const nextMap: Record<string, string> = {
    'M073': 'M085', 'M074': 'M085',
    'M075': 'M086', 'M076': 'M086',
    'M077': 'M087', 'M078': 'M087',
    'M079': 'M088', 'M080': 'M088',
    'M081': 'M089', 'M101': 'M089',
    'M083': 'M090', 'M104': 'M090',
    'M082': 'M091', 'M102': 'M091',
    'M084': 'M092', 'M103': 'M092',
    'M085': 'M093', 'M089': 'M093',
    'M088': 'M094', 'M091': 'M094',
    'M086': 'M095', 'M090': 'M095',
    'M087': 'M096', 'M092': 'M096',
    'M093': 'M097', 'M094': 'M097',
    'M095': 'M098', 'M096': 'M098',
    'M097': 'M100', 'M098': 'M100',
  };
  return nextMap[matchId] || null;
}