'use client';

import { useState } from 'react';

interface NotificationModalProps {
  matchId: string;
  matchName: string;
  onClose: () => void;
  onSave: (matchId: string, type: string, minutesBefore: number) => void;
}

export default function NotificationModal({ matchId, matchName, onClose, onSave }: NotificationModalProps) {
  const [notificationType, setNotificationType] = useState<'before' | 'kickoff'>('before');
  const [minutesBefore, setMinutesBefore] = useState(30);

  const handleSave = () => {
    onSave(matchId, notificationType, notificationType === 'kickoff' ? 0 : minutesBefore);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">🔔</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Bildirim Kur</h3>
              <p className="text-sm text-gray-500">Maçı kaçırmayın!</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <p className="font-semibold text-gray-900">{matchName}</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Bildirim Türü</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setNotificationType('before')} className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${notificationType === 'before' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                ⏰ Maçtan Önce
              </button>
              <button onClick={() => setNotificationType('kickoff')} className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${notificationType === 'kickoff' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                🚀 Başlangıçta
              </button>
            </div>
          </div>

          {notificationType === 'before' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Kaç Dakika Önce</label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 30, 60].map(mins => (
                  <button key={mins} onClick={() => setMinutesBefore(mins)} className={`py-3 rounded-xl text-sm font-semibold transition-all ${minutesBefore === mins ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {mins} dk
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-3">İptal</button>
          <button onClick={handleSave} className="btn-primary flex-1 py-3">🔔 Bildirimi Kur</button>
        </div>
      </div>
    </div>
  );
}