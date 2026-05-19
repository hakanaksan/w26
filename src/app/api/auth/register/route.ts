import { NextResponse } from 'next/server';
import { client } from '@/lib/db-client';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Tüm alanları doldurun' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });
    }

    const existing = await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email.toLowerCase()] });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kayıtlı' }, { status: 409 });
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const passwordHash = await hashPassword(password);
    const createdAt = new Date().toISOString();

    await client.execute({
      sql: 'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [id, email.toLowerCase(), name, passwordHash, createdAt],
    });

    return NextResponse.json({ id, email: email.toLowerCase(), name }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: `Kayıt oluşturulamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` }, { status: 500 });
  }
}