import { NextResponse } from 'next/server';
import { matches as allMatches } from '@/data/fixtures';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const stage = searchParams.get('stage');

  let filtered = allMatches;

  if (date) {
    filtered = filtered.filter(m => m.date === date);
  }

  if (stage) {
    filtered = filtered.filter(m => m.stage === stage);
  }

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { matchId, homeScore, awayScore } = body;

  return NextResponse.json({
    success: true,
    matchId,
    homeScore,
    awayScore,
  });
}
