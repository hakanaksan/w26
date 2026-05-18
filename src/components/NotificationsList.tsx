'use client';

import { useState, useEffect } from 'react';
import { matches } from '@/data/fixtures';
import { teams } from '@/data/teams';

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

  const getMatchName = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return 'Unknown Match';

    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);

    return `${homeTeam?.flag || ''} ${homeTeam?.name || match.homeTeamId} vs ${awayTeam?.flag || ''} ${awayTeam?.name || match.awayTeamId}`;
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">🔔</span>
        <h3 className="text-lg font-semibold text-white mb-2">No Notifications</h3>
        <p className="text-gray-500">Set notifications for matches you don't want to miss!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map(notification => (
        <div key={notification.id} className="match-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-medium text-white">{getMatchName(notification.matchId)}</p>
              <p className="text-sm text-gray-500">
                {notification.type === 'kickoff'
                  ? 'At kickoff'
                  : `${notification.minutesBefore} minutes before`}
              </p>
            </div>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
