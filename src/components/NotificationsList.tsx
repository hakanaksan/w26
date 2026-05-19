'use client';

import { useState, useEffect } from 'react';
import { matches } from '@/data/fixtures';
import { getTeam, getFlagUrl } from '@/data/teams';
import { useAuth } from '@/lib/auth-context';

interface Notification {
  id: string;
  match_id: string;
  type: string;
  minutes_before: number;
  is_active: number;
  created_at: string;
}

function FlagImg({ code, size = 'w-10 h-7' }: { code: string; size?: string }) {
  const team = getTeam(code);
  const src = team.flag || getFlagUrl(code) || '';
  if (!src) return <div className={`${size} bg-gray-200 rounded flex items-center justify-center text-xs`}>{code}</div>;
  return <img src={src} alt={team.name} className={`${size} rounded object-cover`} />;
}

export default function NotificationsList() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : { notifications: [] })
      .then(data => setNotifications(data.notifications || []))
      .catch(() => {});
  }, [token]);

  const removeNotification = async (id: string) => {
    if (!token) return;
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const getMatchInfo = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return { name: 'Bilinmeyen Maç' };
    const home = getTeam(match.homeTeamId);
    const away = getTeam(match.awayTeamId);
    return { name: `${home.name} vs ${away.name}`, homeId: match.homeTeamId, awayId: match.awayTeamId };
  };

  if (!user) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">👤</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Giriş Yapın</h3>
        <p className="text-gray-500">Bildirim kurmak için giriş yapmanız gerekiyor</p>
        <a href="/auth/login" className="btn-primary inline-block px-8 py-3 mt-4">Giriş Yap</a>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">🔔</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Bildirim Yok</h3>
        <p className="text-gray-500">Kaçırmak istemediğiniz maçlar için bildirim kurun!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map(notification => {
        const info = getMatchInfo(notification.match_id);
        return (
          <div key={notification.id} className="match-card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <FlagImg code={(info as any).homeId} size="w-10 h-7" />
                <FlagImg code={(info as any).awayId} size="w-10 h-7" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{info.name}</p>
                <p className="text-sm text-gray-500">
                  {notification.type === 'kickoff' ? '🚀 Başlangıçta' : `⏰ ${notification.minutes_before} dk önce`}
                </p>
              </div>
            </div>
            <button onClick={() => removeNotification(notification.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}