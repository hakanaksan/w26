import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { matches as scheduledMatches } from '../src/data/fixtures';
import { resolveRealBracket } from '../src/data/bracket';

// Read .env.local
const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

// ESPN Team map (same as in route.ts)
const ESPN_TEAM_MAP = {
  'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR', 'Korea Republic': 'KOR', 'Czech Republic': 'CZE', 'Czechia': 'CZE',
  'Canada': 'CAN', 'Bosnia and Herzegovina': 'BIH', 'Qatar': 'QAT', 'Switzerland': 'SUI',
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  'USA': 'USA', 'United States': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS', 'Turkey': 'TUR', 'Türkiye': 'TUR', 'Turkiye': 'TUR',
  'Germany': 'GER', 'Curacao': 'CUW', 'Curaçao': 'CUW', "Côte d'Ivoire": 'CIV', "Cote d'Ivoire": 'CIV', 'Ivory Coast': 'CIV',
  'Ecuador': 'ECU', 'Netherlands': 'NED', 'Japan': 'JPN', 'Sweden': 'SWE', 'Tunisia': 'TUN',
  'Belgium': 'BEL', 'Egypt': 'EGY', 'Iran': 'IRN', 'IR Iran': 'IRN', 'New Zealand': 'NZL',
  'Spain': 'ESP', 'Cape Verde': 'CPV', 'Cape Verde Islands': 'CPV', 'Cabo Verde': 'CPV',
  'Saudi Arabia': 'KSA', 'Uruguay': 'URU',
  'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  'Portugal': 'POR', 'DR Congo': 'COD', 'Congo DR': 'COD', 'Democratic Republic of the Congo': 'COD',
  'Uzbekistan': 'UZB', 'Colombia': 'COL',
  'England': 'ENG', 'Croatia': 'CRO', 'Ghana': 'GHA', 'Panama': 'PAN',
  'MEX': 'MEX', 'RSA': 'RSA', 'KOR': 'KOR', 'CZE': 'CZE',
  'CAN': 'CAN', 'BIH': 'BIH', 'QAT': 'QAT', 'SUI': 'SUI',
  'BRA': 'BRA', 'MAR': 'MAR', 'HAI': 'HAI', 'SCO': 'SCO',
  'USA': 'USA', 'PAR': 'PAR', 'AUS': 'AUS', 'TUR': 'TUR',
  'GER': 'GER', 'CUW': 'CUW', 'CIV': 'CIV', 'ECU': 'ECU',
  'NED': 'NED', 'JPN': 'JPN', 'SWE': 'SWE', 'TUN': 'TUN',
  'BEL': 'BEL', 'EGY': 'EGY', 'IRN': 'IRN', 'NZL': 'NZL',
  'ESP': 'ESP', 'CPV': 'CPV', 'KSA': 'KSA', 'URU': 'URU',
  'FRA': 'FRA', 'SEN': 'SEN', 'IRQ': 'IRQ', 'NOR': 'NOR',
  'ARG': 'ARG', 'ALG': 'ALG', 'AUT': 'AUT', 'JOR': 'JOR',
  'POR': 'POR', 'COD': 'COD', 'UZB': 'UZB', 'COL': 'COL',
  'ENG': 'ENG', 'CRO': 'CRO', 'GHA': 'GHA', 'PAN': 'PAN',
};

function mapTeamName(name) {
  if (!name) return '';
  const cleanName = name.trim().toLowerCase();
  
  if (ESPN_TEAM_MAP[name]) return ESPN_TEAM_MAP[name];
  
  for (const [key, code] of Object.entries(ESPN_TEAM_MAP)) {
    const cleanKey = key.toLowerCase();
    if (cleanKey === cleanName || cleanName.includes(cleanKey) || cleanKey.includes(cleanName)) {
      return code;
    }
  }
  return '';
}

function mapEspnTeamCode(abbrev, name) {
  if (abbrev && ESPN_TEAM_MAP[abbrev]) return ESPN_TEAM_MAP[abbrev];
  if (name) {
    const mapped = mapTeamName(name);
    if (mapped) return mapped;
  }
  return abbrev || '';
}

async function main() {
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

  // 1. Load resolved bracket slots based on DB scores
  const scoresResult = await client.execute('SELECT * FROM match_scores');
  const dbScores = {};
  for (const row of scoresResult.rows) {
    dbScores[row.match_id] = {
      homeScore: row.home_score,
      awayScore: row.away_score,
      homePenaltyScore: row.home_penalty_score,
      awayPenaltyScore: row.away_penalty_score,
      isCompleted: row.is_completed === 1
    };
  }

  const mergedMatches = scheduledMatches.map(m => {
    const s = dbScores[m.id];
    if (s) {
      return {
        ...m,
        homeScore: s.homeScore,
        awayScore: s.awayScore,
        homePenaltyScore: s.homePenaltyScore,
        awayPenaltyScore: s.awayPenaltyScore,
        isCompleted: s.isCompleted,
      };
    }
    return m;
  });

  const resolvedSlots = resolveRealBracket(mergedMatches);

  // 2. Fetch ESPN scoreboard
  const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260705';
  console.log('Fetching ESPN scoreboard...');
  const response = await fetch(url);
  const json = await response.json();
  const events = json.events || [];
  console.log(`Fetched ${events.length} events from ESPN.`);

  let insertedCount = 0;

  for (const ev of events) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;

    const home = comp.competitors?.find(c => c.homeAway === 'home');
    const away = comp.competitors?.find(c => c.homeAway === 'away');
    if (!home || !away) continue;

    const homeCode = mapEspnTeamCode(home.team?.abbreviation || '', home.team?.displayName || home.team?.name || '');
    const awayCode = mapEspnTeamCode(away.team?.abbreviation || '', away.team?.displayName || away.team?.name || '');
    const evDate = (ev.date || comp.date || '').split('T')[0];

    // Find local match
    let localMatchId = null;

    // 1. Try matching against resolved bracket slots for knockout matches
    const matchedSlot = resolvedSlots.find(slot => {
      const isSameTeams = (slot.homeTeamId === homeCode && slot.awayTeamId === awayCode) ||
                          (slot.homeTeamId === awayCode && slot.awayTeamId === homeCode);
      return isSameTeams;
    });

    // 2. If not a knockout match or no slot found, fallback to scheduled group matches
    const scheduled = matchedSlot ? scheduledMatches.find(sm => sm.id === matchedSlot.matchId) : scheduledMatches.find(sm => {
      const isSameTeams = (sm.homeTeamId === homeCode && sm.awayTeamId === awayCode) ||
                          (sm.homeTeamId === awayCode && sm.awayTeamId === homeCode);
      if (!isSameTeams) return false;

      const scheduledDateVal = new Date(sm.date + 'T00:00:00Z').getTime();
      const fetchedDateVal = new Date(evDate + 'T00:00:00Z').getTime();
      const diffDays = Math.abs(scheduledDateVal - fetchedDateVal) / (24 * 60 * 60 * 1000);
      return diffDays <= 3;
    });

    const targetMatch = matchedSlot ? { id: matchedSlot.matchId, date: scheduled?.date || evDate, homeTeamId: matchedSlot.homeTeamId, awayTeamId: matchedSlot.awayTeamId } : scheduled;

    if (targetMatch) {
      localMatchId = targetMatch.id;
    }

    if (!localMatchId) {
      console.log(`Could not match ESPN event: ${home.team?.displayName} vs ${away.team?.displayName} on ${evDate}`);
      continue;
    }

    const isSwapped = targetMatch.homeTeamId === awayCode && targetMatch.awayTeamId === homeCode;
    const finalHomeCode = isSwapped ? awayCode : homeCode;
    const finalAwayCode = isSwapped ? homeCode : awayCode;

    console.log(`Processing match ${localMatchId}: ${home.team?.displayName} vs ${away.team?.displayName} (swapped: ${isSwapped})`);

    // Clean existing scorers in DB for this match
    await client.execute({
      sql: 'DELETE FROM scorers WHERE match_id = ?',
      args: [localMatchId]
    });

    // Parse and insert goals
    if (comp.details && Array.isArray(comp.details)) {
      for (const d of comp.details) {
        const typeId = d.type?.id ?? 0;
        const isGoal = typeId === 70 || d.scoringPlay === true;
        
        // Note: Do NOT insert penalty shootout goals into scorers table (only regular/extra time goals)
        const isPenaltyShootout = d.type?.text?.toLowerCase().includes('penalty -') || d.type?.description?.toLowerCase().includes('penalty -');
        
        if (isGoal && !isPenaltyShootout) {
          const athlete = d.athletesInvolved?.[0];
          const eventTeamId = String(d.team?.id ?? '');
          const isHomeGoal = eventTeamId === String(home.team?.id ?? '');
          const isAwayGoal = eventTeamId === String(away.team?.id ?? '');
          const rawGoalTeamCode = isHomeGoal ? homeCode : (isAwayGoal ? awayCode : mapEspnTeamCode(d.team?.abbreviation || '', d.team?.displayName || ''));
          
          // Map goal team code to matched local team code in case of swap
          const resolvedTeamCode = rawGoalTeamCode === homeCode ? finalHomeCode : finalAwayCode;
          
          const resolvedPlayerName = athlete?.displayName || athlete?.shortName || 'Unknown';
          const minute = d.clock?.displayValue ? parseInt(d.clock.displayValue.replace("'", '').split('+')[0]) || null : (Math.round((d.clock?.value || 0) / 60) || null);
          const isPenalty = d.penaltyKick === true ? 1 : 0;
          const isOwnGoal = d.ownGoal === true ? 1 : 0;

          const scorerId = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          await client.execute({
            sql: `INSERT INTO scorers (id, match_id, team_id, player_name, minute, is_penalty, is_own_goal, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [scorerId, localMatchId, resolvedTeamCode, resolvedPlayerName, minute, isPenalty, isOwnGoal, new Date().toISOString()]
          });
          insertedCount++;
        }
      }
    }
  }

  console.log(`Successfully synced ${insertedCount} goals from ESPN.`);
}

main().catch(console.error);
