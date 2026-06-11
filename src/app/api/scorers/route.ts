import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scorers } from '@/lib/schema';
import { desc, sql, asc, and, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allScorers = await db.select().from(scorers).orderBy(desc(scorers.createdAt));

    const ranking = allScorers.reduce((acc, s) => {
      const key = `${s.teamId}|${s.playerName}`;
      if (!acc[key]) {
        acc[key] = { teamId: s.teamId, playerName: s.playerName, goals: 0, penalties: 0, ownGoals: 0 };
      }
      if (s.isOwnGoal) {
        acc[key].ownGoals++;
      } else {
        acc[key].goals++;
        if (s.isPenalty) acc[key].penalties++;
      }
      return acc;
    }, {} as Record<string, { teamId: string; playerName: string; goals: number; penalties: number; ownGoals: number }>);

    const leaderboard = Object.values(ranking)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 50);

    return NextResponse.json({ scorers: allScorers, leaderboard });
  } catch (error) {
    console.error('Scorers GET error:', error);
    return NextResponse.json({ scorers: [], leaderboard: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matchId, teamId, playerName, minute, isPenalty, isOwnGoal } = body;

    if (!matchId || !teamId || !playerName) {
      return NextResponse.json({ error: 'matchId, teamId ve playerName zorunlu' }, { status: 400 });
    }

    const existing = await db.select({ id: scorers.id }).from(scorers).where(
      and(
        eq(scorers.matchId, matchId),
        eq(scorers.teamId, teamId),
        eq(scorers.playerName, playerName),
        eq(scorers.minute, minute || null),
      )
    ).limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ id: existing[0].id, matchId, teamId, playerName, minute, isPenalty: !!isPenalty, isOwnGoal: !!isOwnGoal, duplicate: true });
    }

    const id = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    await db.insert(scorers).values({
      id,
      matchId,
      teamId,
      playerName,
      minute: minute || null,
      isPenalty: isPenalty ? 1 : 0,
      isOwnGoal: isOwnGoal ? 1 : 0,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id, matchId, teamId, playerName, minute, isPenalty: !!isPenalty, isOwnGoal: !!isOwnGoal });
  } catch (error) {
    console.error('Scorer POST error:', error);
    return NextResponse.json({ error: 'Gol kaydedilemedi' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });
    }

    const { eq } = await import('drizzle-orm');
    await db.delete(scorers).where(eq(scorers.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Scorer DELETE error:', error);
    return NextResponse.json({ error: 'Gol silinemedi' }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const allScorers = await db.select().from(scorers).orderBy(asc(scorers.createdAt));
    const seen = new Set<string>();
    const duplicateIds: string[] = [];

    for (const s of allScorers) {
      const sig = `${s.matchId}|${s.teamId}|${s.playerName}|${s.minute}`;
      if (seen.has(sig)) {
        duplicateIds.push(s.id);
      } else {
        seen.add(sig);
      }
    }

    if (duplicateIds.length > 0) {
      for (const id of duplicateIds) {
        await db.delete(scorers).where(eq(scorers.id, id));
      }
    }

    return NextResponse.json({ removed: duplicateIds.length, total: allScorers.length });
  } catch (error) {
    console.error('Scorer PATCH cleanup error:', error);
    return NextResponse.json({ error: 'Temizleme başarısız' }, { status: 500 });
  }
}