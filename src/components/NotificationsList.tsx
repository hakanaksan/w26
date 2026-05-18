'use client';

import { useState, useEffect } from 'react';
import { matches } from '@/data/fixtures';
import { getTeam } from '@/data/teams';

interface Notification {
  id: string;
  matchId: string;
  type: string;
  minutesBefore: number;
  isActive: boolean;
  createdAt: string;
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('wc2026_notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
    }
  }, []);

  const removeNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('wc2026_notifications', JSON.stringify(updated));
  };

  const getMatchInfo = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return { name: 'Bilinmeyen Maç', homeFlag: '❓', awayFlag: '❓' };

    const homeTeam = getTeam(match.homeTeamId);
    const awayTeam = getTeam(match.awayTeamId);

    return {
      name: `${homeTeam.name} vs ${awayTeam.name}`,
      homeFlag: homeTeam.flag,
      awayFlag: awayTeam.flag,
    };
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">
          🔔
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Bildirim Yok</h3>
        <p className="text-gray-500">Kaçırmak istemediğiniz maçlar için bildirim kurun!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map(notification => {
        const matchInfo = getMatchInfo(notification.matchId);
        return (
          <div key={notification.id} className="match-card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl border-2 border-white">
                  {matchInfo.homeFlag}
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl border-2 border-white">
                  {matchInfo.awayFlag}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{matchInfo.name}</p>
                <p className="text-sm text-gray-500">
                  {notification.type === 'kickoff'
                    ? '🚀 Başlangıçta'
                    : `⏰ ${notification.minutesBefore} dakika önce`}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
