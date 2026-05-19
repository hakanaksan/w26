import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leagues, leagueMembers, predictions, users, matchScores } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, userId } = body;
    if (!name || !userId) return NextResponse.json({ error: 'name ve userId zorunlu' }, { status: 400 });

    const id = `lg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const code = generateCode();
    const now = new Date().toISOString();

    await db.insert(leagues).values({ id, name, code, ownerId: userId, createdAt: now });
    await db.insert(leagueMembers).values({ id: `lm_${Date.now()}`, leagueId: id, userId, joinedAt: now });

    return NextResponse.json({ league: { id, name, code, ownerId: userId, createdAt: now } });
  } catch (error) {
    console.error('League POST error:', error);
    return NextResponse.json({ error: 'Lig oluşturulamadı' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const code = searchParams.get('code');

  if (code) {
    const league = await db.select().from(leagues).where(eq(leagues.code, code)).limit(1);
    if (league.length === 0) return NextResponse.json({ error: 'Lig bulunamadı' }, { status: 404 });

    const members = await db.select({ id: leagueMembers.id, userId: leagueMembers.userId, joinedAt: leagueMembers.joinedAt, name: users.name })
      .from(leagueMembers).leftJoin(users, eq(leagueMembers.userId, users.id))
      .where(eq(leagueMembers.leagueId, league[0].id));

    return NextResponse.json({ league: league[0], members });
  }

  if (userId) {
    const memberOf = await db.select({ leagueId: leagueMembers.leagueId }).from(leagueMembers).where(eq(leagueMembers.userId, userId));
    const leagueIds = memberOf.map(m => m.leagueId);
    if (leagueIds.length === 0) return NextResponse.json({ leagues: [] });

    const userLeagues = await db.select().from(leagues).where(sql`${leagues.id} IN (${leagueIds.map(id => `'${id}'`).join(',')})`);
    return NextResponse.json({ leagues: userLeagues });
  }

  return NextResponse.json({ error: 'userId veya code zorunlu' }, { status: 400 });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { code, userId } = body;
    if (!code || !userId) return NextResponse.json({ error: 'code ve userId zorunlu' }, { status: 400 });

    const league = await db.select().from(leagues).where(eq(leagues.code, code)).limit(1);
    if (league.length === 0) return NextResponse.json({ error: 'Lig bulunamadı' }, { status: 404 });

    const existing = await db.select().from(leagueMembers).where(and(eq(leagueMembers.leagueId, league[0].id), eq(leagueMembers.userId, userId))).limit(1);
    if (existing.length > 0) return NextResponse.json({ error: 'Zaten bu ligtesiniz' }, { status: 400 });

    const id = `lm_${Date.now()}`;
    await db.insert(leagueMembers).values({ id, leagueId: league[0].id, userId, joinedAt: new Date().toISOString() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('League PUT error:', error);
    return NextResponse.json({ error: 'Lige katılınamadı' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { leagueId, userId } = body;
    if (!leagueId || !userId) return NextResponse.json({ error: 'leagueId ve userId zorunlu' }, { status: 400 });

    const league = await db.select().from(leagues).where(eq(leagues.id, leagueId)).limit(1);
    if (league.length === 0) return NextResponse.json({ error: 'Lig bulunamadı' }, { status: 404 });

    await db.delete(leagueMembers).where(and(eq(leagueMembers.leagueId, leagueId), eq(leagueMembers.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('League DELETE error:', error);
    return NextResponse.json({ error: 'Ligten çıkılamadı' }, { status: 500 });
  }
}