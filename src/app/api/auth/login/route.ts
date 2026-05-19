import { NextResponse } from 'next/server';
import { client } from '@/lib/db-client';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli' }, { status: 400 });
    }

    const result = await client.execute({ sql: 'SELECT id, email, name, password_hash FROM users WHERE email = ?', args: [email.toLowerCase()] });
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 });
    }

    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash as string);
    if (!isValid) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id as string, email: user.email as string });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Giriş yapılamadı' }, { status: 500 });
  }
}