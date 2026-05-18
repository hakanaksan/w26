'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DaySelector from '@/components/DaySelector';
import MatchCard from '@/components/MatchCard';
import GroupStandings from '@/components/GroupStandings';
import NotificationsList from '@/components/NotificationsList';
import NotificationModal from '@/components/NotificationModal';
import { matches as allMatches } from '@/data/fixtures';
import { getTeam } from '@/data/teams';

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
      const homeTeam = getTeam(match.homeTeamId);
      const awayTeam = getTeam(match.awayTeamId);
      setNotificationModal({
        matchId,
        matchName: `${homeTeam.flag} ${homeTeam.name} vs ${awayTeam.flag} ${awayTeam.name}`,
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
        new Notification('Dünya Kupası 2026', {
          body: `${match.homeTeamId} vs ${match.awayTeamId} yakında başlıyor!`,
          icon: '/favicon.ico',
        });
      }, delay);
    }
  };

  const getMatchesByDate = (date: string) => {
    return matches.filter(m => m.date === date);
  };

  const getMatchStats = () => {
    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.isCompleted).length;
    const totalGoals = matches.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0);
    return { totalMatches, completedMatches, totalGoals };
  };

  const stats = getMatchStats();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'fixtures' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black mb-2">2026 FIFA Dünya Kupası</h2>
                  <p className="text-blue-100 text-lg">11 Haziran - 19 Temmuz 2026 • ABD, Kanada ve Meksika</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-black">{stats.totalMatches}</p>
                    <p className="text-blue-200 text-sm">Toplam Maç</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black">{stats.completedMatches}</p>
                    <p className="text-blue-200 text-sm">Tamamlanan</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black">{stats.totalGoals}</p>
                    <p className="text-blue-200 text-sm">Gol</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Tarih Seç</h3>
              <DaySelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                Maçlar - {new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {getMatchesByDate(selectedDate).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">
                    ⚽
                  </div>
                  <p className="text-gray-500 text-lg">Bu tarih için maç bulunmuyor</p>
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
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Grup Puan Durumu</h2>
                <p className="text-gray-500">Takımların durumunu takip edin</p>
              </div>
            </div>
            <GroupStandings selectedGroup={selectedGroup} onGroupChange={setSelectedGroup} />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
                🔔
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Bildirimlerim</h2>
                <p className="text-gray-500">Maçları kaçırmayın!</p>
              </div>
            </div>
            <NotificationsList />
          </div>
        )}
      </main>

      <footer className="mt-16 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🏆</span>
            <span className="font-bold text-gray-900">FIFA Dünya Kupası 2026</span>
          </div>
          <p className="text-sm text-gray-500">Fikstür Takip • Next.js & Turso ile yapıldı</p>
        </div>
      </footer>

      {notificationModal && (
        <NotificationModal
          matchId={notificationModal.matchId}
          matchName={notificationModal.matchName}
          onClose={() => setNotificationModal(null)}
          onSave={handleSaveNotification}
        />
      )}
    </div>
  );
}
