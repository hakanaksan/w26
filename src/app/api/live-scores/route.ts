import { NextResponse } from 'next/server';

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || '';
const API_FOOTBALL_HOST = 'v3.football.api-sports.io';
const WORLD_CUP_LEAGUE_ID = 1;
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
const THESPORTSDB_KEY = '3';

const FD_TEAM_MAP: Record<string, string> = {
  'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR', 'Czech Republic': 'CZE',
  'Canada': 'CAN', 'Bosnia and Herzegovina': 'BIH', 'Qatar': 'QAT', 'Switzerland': 'SUI',
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  'USA': 'USA', 'United States': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS', 'Turkey': 'TUR',
  'Germany': 'GER', 'Curacao': 'CUW', "Côte d'Ivoire": 'CIV', 'Ivory Coast': 'CIV',
  'Ecuador': 'ECU', 'Netherlands': 'NED', 'Japan': 'JPN', 'Sweden': 'SWE', 'Tunisia': 'TUN',
  'Belgium': 'BEL', 'Egypt': 'EGY', 'Iran': 'IRN', 'New Zealand': 'NZL',
  'Spain': 'ESP', 'Cape Verde': 'CPV', 'Cape Verde Islands': 'CPV',
  'Saudi Arabia': 'KSA', 'Uruguay': 'URU',
  'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  'Portugal': 'POR', 'DR Congo': 'COD', 'Congo DR': 'COD',
  'Uzbekistan': 'UZB', 'Colombia': 'COL',
  'England': 'ENG', 'Croatia': 'CRO', 'Ghana': 'GHA', 'Panama': 'PAN',
};

const ESPN_TEAM_MAP: Record<string, string> = {
  ...FD_TEAM_MAP,
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

const AF_TEAM_MAP: Record<string, string> = { ...FD_TEAM_MAP, "Cote d'Ivoire": 'CIV' };

interface GoalEvent {
  minute: number | null;
  playerName: string;
  teamName: string;
  teamCode: string;
  isPenalty: boolean;
  isOwnGoal: boolean;
}

interface MatchResult {
  id: string;
  source: string;
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  date: string;
  time: string;
  isCompleted: boolean;
  isLive: boolean;
  goals: GoalEvent[];
  minute: number | null;
}

let cachedData: { timestamp: number; data: unknown; key: string } | null = null;
const CACHE_TTL = 60 * 1000; // 1 minute for live data

function parseStatus(raw: string, source: string): { isCompleted: boolean; isLive: boolean } {
  if (source === 'football-data') {
    return {
      isCompleted: raw === 'FINISHED' || raw === 'AWAY_WIN' || raw === 'HOME_WIN' || raw === 'DRAW',
      isLive: raw === 'IN_PLAY' || raw === 'PAUSED' || raw === 'HALFTIME',
    };
  }
  if (source === 'espn') {
    const lower = raw.toLowerCase();
    return {
      isCompleted: lower.includes('final') || lower.includes('full') || lower === 'ft' || lower === 'aet' || lower === 'pen',
      isLive: lower.includes('half') || lower.includes('progress') || lower.includes('live') || /^\d+$/.test(raw) || lower.includes('1st') || lower.includes('2nd'),
    };
  }
  return {
    isCompleted: raw === 'FT' || raw === 'AET' || raw === 'PEN',
    isLive: ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(raw),
  };
}

function mapEspnTeamCode(abbrev: string, name: string): string {
  if (abbrev && ESPN_TEAM_MAP[abbrev]) return ESPN_TEAM_MAP[abbrev];
  if (name) {
    for (const [key, code] of Object.entries(FD_TEAM_MAP)) {
      if (name.toLowerCase().includes(key.toLowerCase())) return code;
    }
  }
  return abbrev || '';
}

async function fetchESPN(dateStr: string): Promise<{ matches: MatchResult[]; ok: boolean }> {
  try {
    const espnDate = dateStr.replace(/-/g, '');
    const url = `${ESPN_BASE}/scoreboard?dates=${espnDate}`;
    const response = await fetch(url, { next: { revalidate: 30 } });
    if (!response.ok) return { matches: [], ok: false };

    const json = await response.json();
    const events = json.events || [];
    const matches: MatchResult[] = events.map((ev: any) => {
      const comp = ev.competitions?.[0];
      if (!comp) return null;

      const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
      const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
      if (!home || !away) return null;

      const homeCode = mapEspnTeamCode(home.team?.abbreviation || '', home.team?.displayName || home.team?.name || '');
      const awayCode = mapEspnTeamCode(away.team?.abbreviation || '', away.team?.displayName || away.team?.name || '');
      const status = parseStatus(comp.status?.type?.name || comp.status?.type?.description || '', 'espn');

      const goals: GoalEvent[] = [];
      if (comp.details && Array.isArray(comp.details)) {
        for (const d of comp.details) {
          const typeName = d.type?.name || d.type?.text || '';
          const isGoal = typeName === 'Goal' || d.scoringPlay === true || d.type?.id === '70';
          const isYellow = typeName === 'Yellow Card' || d.yellowCard === true || d.type?.id === '94';
          const isRed = typeName === 'Red Card' || d.redCard === true;

          if (isGoal || isYellow || isRed) {
            const athlete = d.athletesInvolved?.[0];
            const teamInfo = d.team;
            goals.push({
              minute: d.clock?.displayValue ? parseInt(d.clock.displayValue.replace("'", '').replace('+', '')) || null : (Math.round((d.clock?.value || 0) / 60) || null),
              playerName: athlete?.displayName || athlete?.shortName || '',
              teamName: d.team?.displayName || '',
              teamCode: mapEspnTeamCode(d.team?.abbreviation || '', d.team?.displayName || ''),
              isPenalty: d.penaltyKick === true,
              isOwnGoal: d.ownGoal === true,
            });
          }
        }
      }

      let minute: number | null = null;
      if (comp.status?.displayClock) {
        const clockStr = comp.status.displayClock;
        const parsed = parseInt(clockStr.replace("'", '').replace('+', '').split('+')[0]);
        if (!isNaN(parsed)) minute = parsed;
      }
      if (!minute && comp.status?.type?.name === 'STATUS_HALFTIME') {
        minute = 45;
      }

      const matchDate = (ev.date || comp.date || '').split('T')[0];
      const matchTime = comp.date ? new Date(comp.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Istanbul' }) : '';

      const homeScoreVal = home.score !== undefined ? parseInt(home.score) : null;
      const awayScoreVal = away.score !== undefined ? parseInt(away.score) : null;

      // Scheduled matches have score "0"-"0" but haven't started — treat as null
      const effectiveHomeScore = status.isLive || status.isCompleted ? homeScoreVal : (homeScoreVal !== null && homeScoreVal > 0 ? homeScoreVal : null);
      const effectiveAwayScore = status.isLive || status.isCompleted ? awayScoreVal : (awayScoreVal !== null && awayScoreVal > 0 ? awayScoreVal : null);

      return {
        id: `espn_${ev.id}`,
        source: 'espn',
        homeTeam: home.team?.displayName || home.team?.name || '',
        awayTeam: away.team?.displayName || away.team?.name || '',
        homeCode,
        awayCode,
        homeLogo: home.team?.logo || '',
        awayLogo: away.team?.logo || '',
        homeScore: effectiveHomeScore,
        awayScore: effectiveAwayScore,
        status: comp.status?.type?.name || '',
        date: matchDate || dateStr,
        time: matchTime,
        isCompleted: status.isCompleted,
        isLive: status.isLive,
        goals,
        minute,
      };
    }).filter((m: any) => m !== null);

    return { matches, ok: matches.length > 0 };
  } catch {
    return { matches: [], ok: false };
  }
}

async function fetchTheSportsDB(dateStr: string): Promise<{ matches: MatchResult[]; ok: boolean }> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_KEY}/eventsday.php?d=${dateStr}&l=4429`;
    const response = await fetch(url, { next: { revalidate: 120 } });
    if (!response.ok) return { matches: [], ok: false };

    const json = await response.json();
    const events = json.events;
    if (!events || !Array.isArray(events)) return { matches: [], ok: false };

    const matches: MatchResult[] = events.map((ev: any) => {
      const homeTeam = ev.strHomeTeam || '';
      const awayTeam = ev.strAwayTeam || '';
      const homeCode = FD_TEAM_MAP[homeTeam] || '';
      const awayCode = FD_TEAM_MAP[awayTeam] || '';
      const rawStatus = ev.strStatus || ev.intProgress || '';
      const status = parseStatus(rawStatus, 'thesportsdb');

      let matchDate = ev.dateEvent || dateStr;
      let matchTime = ev.strTime || '';
      if (ev.strTimestamp) {
        try {
          const d = new Date(ev.strTimestamp);
          matchTime = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Istanbul' });
        } catch {}
      }

      const tsdbHomeScore = ev.intHomeScore !== null && ev.intHomeScore !== undefined ? parseInt(ev.intHomeScore) : null;
        const tsdbAwayScore = ev.intAwayScore !== null && ev.intAwayScore !== undefined ? parseInt(ev.intAwayScore) : null;
        const effectiveHomeScore2 = status.isLive || status.isCompleted ? tsdbHomeScore : (tsdbHomeScore !== null && tsdbHomeScore > 0 ? tsdbHomeScore : null);
        const effectiveAwayScore2 = status.isLive || status.isCompleted ? tsdbAwayScore : (tsdbAwayScore !== null && tsdbAwayScore > 0 ? tsdbAwayScore : null);

      return {
        id: `tsdb_${ev.idEvent}`,
        source: 'thesportsdb',
        homeTeam,
        awayTeam,
        homeCode,
        awayCode,
        homeLogo: ev.strHomeTeamBadge || ev.strThumb || '',
        awayLogo: ev.strAwayTeamBadge || '',
        homeScore: effectiveHomeScore2,
        awayScore: effectiveAwayScore2,
        status: rawStatus,
        date: matchDate,
        time: matchTime,
        isCompleted: status.isCompleted,
        isLive: status.isLive,
        goals: [],
        minute: null,
      };
    });

    return { matches, ok: matches.length > 0 };
  } catch {
    return { matches: [], ok: false };
  }
}

async function fetchFootballDataOrg(date: string): Promise<{ matches: MatchResult[]; fallback: boolean }> {
  try {
    const url = `https://api.football-data.org/v4/matches?date=${date}`;
    const response = await fetch(url, {
      headers: { 'X-Auth-Token': 'free' },
      next: { revalidate: 300 },
    });
    if (!response.ok) return { matches: [], fallback: true };

    const json = await response.json();
    const matches: MatchResult[] = (json.matches || [])
      .filter((m: any) => m.competition?.id === 2000)
      .map((m: any) => {
        const homeCode = FD_TEAM_MAP[m.homeTeam?.name] || m.homeTeam?.tla || '';
        const awayCode = FD_TEAM_MAP[m.awayTeam?.name] || m.awayTeam?.tla || '';
        const status = parseStatus(m.status, 'football-data');
        return {
          id: `fd_${m.id}`,
          source: 'football-data',
          homeTeam: m.homeTeam?.name || '',
          awayTeam: m.awayTeam?.name || '',
          homeCode,
          awayCode,
          homeLogo: m.homeTeam?.crest || '',
          awayLogo: m.awayTeam?.crest || '',
          homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
          awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
          status: m.status || '',
          date: (m.utcDate || '').split('T')[0],
          time: m.utcDate ? new Date(m.utcDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Istanbul' }) : '',
          isCompleted: status.isCompleted,
          isLive: status.isLive,
          goals: [],
          minute: null,
        };
      });

    return { matches, fallback: false };
  } catch {
    return { matches: [], fallback: true };
  }
}

async function fetchApiFootball(date: string): Promise<{ matches: MatchResult[]; fallback: boolean }> {
  if (!API_FOOTBALL_KEY) return { matches: [], fallback: true };

  try {
    const year = parseInt(date.split('-')[0]);
    const season = year >= 2026 ? 2026 : year >= 2022 ? 2022 : year;
    const url = `https://${API_FOOTBALL_HOST}/fixtures?date=${date}&league=${WORLD_CUP_LEAGUE_ID}&season=${season}`;
    const response = await fetch(url, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY },
    });
    if (!response.ok) return { matches: [], fallback: true };

    const json = await response.json();
    const matches: MatchResult[] = (json.response || []).map((f: any) => {
      const homeCode = AF_TEAM_MAP[f.teams?.home?.name] || '';
      const awayCode = AF_TEAM_MAP[f.teams?.away?.name] || '';
      const status = parseStatus(f.fixture?.status?.short, 'api-football');
      const goals: GoalEvent[] = (f.events || [])
        .filter((e: any) => e.type === 'Goal')
        .map((e: any) => ({
          minute: e.time?.elapsed ?? null,
          playerName: e.player?.name || '',
          teamName: e.team?.name || '',
          teamCode: AF_TEAM_MAP[e.team?.name] || '',
          isPenalty: e.detail === 'Penalty',
          isOwnGoal: e.detail === 'Own Goal',
        }));

      return {
        id: `af_${f.fixture?.id}`,
        source: 'api-football',
        homeTeam: f.teams?.home?.name || '',
        awayTeam: f.teams?.away?.name || '',
        homeCode,
        awayCode,
        homeLogo: f.teams?.home?.logo || '',
        awayLogo: f.teams?.away?.logo || '',
        homeScore: f.goals?.home ?? null,
        awayScore: f.goals?.away ?? null,
        status: f.fixture?.status?.short || '',
        date: (f.fixture?.date || '').split('T')[0],
        time: f.fixture?.date ? new Date(f.fixture.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Istanbul' }) : '',
        isCompleted: status.isCompleted,
        isLive: status.isLive,
        goals,
        minute: null,
      };
    });

    return { matches, fallback: false };
  } catch {
    return { matches: [], fallback: true };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const cacheKey = `${date}`;

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL && cachedData.key === cacheKey) {
    return NextResponse.json(cachedData.data);
  }

  let matches: MatchResult[] = [];
  let source = 'none';

  // 1. Try ESPN first (free, no auth, live data with goals)
  const espnResult = await fetchESPN(date);
  if (espnResult.ok) {
    matches = espnResult.matches;
    source = 'espn';
  }

  // 2. Try TheSportsDB (free, WC 2026 data)
  if (matches.length === 0) {
    const tsdbResult = await fetchTheSportsDB(date);
    if (tsdbResult.ok) {
      matches = tsdbResult.matches;
      source = 'thesportsdb';
    }
  }

  // 3. Try football-data.org (free tier)
  if (matches.length === 0) {
    const fdResult = await fetchFootballDataOrg(date);
    if (fdResult.matches.length > 0) {
      matches = fdResult.matches;
      source = 'football-data';
    } else if (!fdResult.fallback) {
      source = 'football-data';
    }
  }

  // 4. Try api-football (requires key)
  if (matches.length === 0 && API_FOOTBALL_KEY) {
    const afResult = await fetchApiFootball(date);
    if (afResult.matches.length > 0) {
      matches = afResult.matches;
      source = 'api-football';
    }
  }

  // 5. Manual mode if nothing works
  if (matches.length === 0 && source === 'none') {
    if (!API_FOOTBALL_KEY) source = 'manual';
    else source = 'none';
  }

  // Deduplicate by team codes (multiple sources might overlap)
  const seen = new Set<string>();
  const deduped = matches.filter(m => {
    const key = `${m.date}_${m.homeCode}_${m.awayCode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const result = { source, matches: deduped, fetchedAt: new Date().toISOString() };
  cachedData = { timestamp: Date.now(), data: result, key: cacheKey };
  return NextResponse.json(result);
}