import { NextResponse } from 'next/server';

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || '';
const API_FOOTBALL_HOST = 'v3.football.api-sports.io';
const WORLD_CUP_LEAGUE_ID = 1;

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

const AF_TEAM_MAP: Record<string, string> = {
  ...FD_TEAM_MAP,
  "Cote d'Ivoire": 'CIV',
};

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
}

let cachedData: { timestamp: number; data: unknown; key: string } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

function parseStatus(raw: string, source: string): { isCompleted: boolean; isLive: boolean } {
  if (source === 'football-data') {
    return {
      isCompleted: raw === 'FINISHED' || raw === 'AWAY_WIN' || raw === 'HOME_WIN' || raw === 'DRAW',
      isLive: raw === 'IN_PLAY' || raw === 'PAUSED' || raw === 'HALFTIME',
    };
  }
  return {
    isCompleted: raw === 'FT' || raw === 'AET' || raw === 'PEN',
    isLive: ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'].includes(raw),
  };
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
  const live = searchParams.get('live') === '1';
  const cacheKey = `${date}-${live}`;

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL && cachedData.key === cacheKey) {
    return NextResponse.json(cachedData.data);
  }

  let matches: MatchResult[] = [];
  let source = 'none';

  const fdResult = await fetchFootballDataOrg(date);
  if (fdResult.matches.length > 0) {
    matches = fdResult.matches;
    source = 'football-data';
  } else if (!fdResult.fallback) {
    source = 'football-data';
  }

  if (matches.length === 0) {
    const afResult = await fetchApiFootball(date);
    if (afResult.matches.length > 0) {
      matches = afResult.matches;
      source = 'api-football';
    } else if (!API_FOOTBALL_KEY) {
      source = 'manual';
    } else {
      source = afResult.fallback ? 'manual' : 'api-football';
    }
  }

  const result = { source, matches, fetchedAt: new Date().toISOString() };
  cachedData = { timestamp: Date.now(), data: result, key: cacheKey };
  return NextResponse.json(result);
}