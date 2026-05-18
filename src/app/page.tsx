'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DaySelector from '@/components/DaySelector';
import MatchCard from '@/components/MatchCard';
import GroupStandings from '@/components/GroupStandings';
import NotificationsList from '@/components/NotificationsList';
import NotificationModal from '@/components/NotificationModal';
import { matches as allMatches } from '@/data/fixtures';
import { teams } from '@/data/teams';

export default function Home() {
  const [activeTab, setActiveTab] = useState('fixtures');
  const [selectedDate, setSelectedDate] = useState('2026-06-11');
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [matches, setMatches] = useState(allMatches);
  const [notificationModal, setNotificationModal] = useState<{ matchId: string; matchName: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('wc2026_matches');
    if (stored) {
      setMatches(JSON.parse(stored));
    }
  }, []);

  const handleScoreUpdate = (matchId: string, homeScore: number, awayScore: number) => {
    const updated = matches.map(m =>
      m.id === matchId
        ? { ...m, homeScore, awayScore, isCompleted: true }
        : m
    );
    setMatches(updated);
    localStorage.setItem('wc2026_matches', JSON.stringify(updated));
  };

  const handleNotify = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      const homeTeam = teams.find(t => t.id === match.homeTeamId);
      const awayTeam = teams.find(t => t.id === match.awayTeamId);
      setNotificationModal({
        matchId,
        matchName: `${homeTeam?.name || match.homeTeamId} vs ${awayTeam?.name || match.awayTeamId}`,
      });
    }
  };

  const handleSaveNotification = (matchId: string, type: string, minutesBefore: number) => {
    const stored = localStorage.getItem('wc2026_notifications');
    const notifications = stored ? JSON.parse(stored) : [];

    const notification = {
      id: `notif_${Date.now()}`,
      matchId,
      type,
      minutesBefore,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    notifications.push(notification);
    localStorage.setItem('wc2026_notifications', JSON.stringify(notifications));

    if ('Notification' in window && Notification.permission === 'granted') {
      scheduleNotification(notification);
    } else if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          scheduleNotification(notification);
        }
      });
    }
  };

  const scheduleNotification = (notification: any) => {
    const match = matches.find(m => m.id === notification.matchId);
    if (!match) return;

    const matchDateTime = new Date(`${match.date}T${match.time}:00`);
    const notifyTime = new Date(matchDateTime.getTime() - notification.minutesBefore * 60000);
    const delay = notifyTime.getTime() - Date.now();

    if (delay > 0 && delay < 2147483647) {
      setTimeout(() => {
        new Notification('World Cup 2026', {
          body: `${match.homeTeamId} vs ${match.awayTeamId} starts soon!`,
          icon: '/favicon.ico',
        });
      }, delay);
    }
  };

  const getMatchesByDate = (date: string) => {
    return matches.filter(m => m.date === date);
  };

  const getUniqueDates = () => {
    return [...new Set(matches.map(m => m.date))].sort();
  };

  return (
    <div className="min-h-screen">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'fixtures' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Match Fixtures</h2>
              <DaySelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>

            <div className="space-y-4">
              {getMatchesByDate(selectedDate).length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-5xl mb-4 block">⚽</span>
                  <p className="text-gray-500">No matches scheduled for this date</p>
                </div>
              ) : (
                getMatchesByDate(selectedDate).map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onScoreUpdate={handleScoreUpdate}
                    onNotify={handleNotify}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Group Standings</h2>
            <GroupStandings selectedGroup={selectedGroup} onGroupChange={setSelectedGroup} />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">My Notifications</h2>
            <NotificationsList />
          </div>
        )}
      </main>

      {notificationModal && (
        <NotificationModal
          matchId={notificationModal.matchId}
          matchName={notificationModal.matchName}
          onClose={() => setNotificationModal(null)}
          onSave={handleSaveNotification}
        />
      )}

      <footer className="mt-12 py-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          FIFA World Cup 2026 Fixture Tracker
        </div>
      </footer>
    </div>
  );
}
