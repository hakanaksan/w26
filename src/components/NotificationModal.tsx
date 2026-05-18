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
    onSave(matchId, notificationType, minutesBefore);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Set Notification</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">{matchName}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notification Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNotificationType('before')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  notificationType === 'before'
                    ? 'bg-fifa-gold text-fifa-dark'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Before Match
              </button>
              <button
                onClick={() => setNotificationType('kickoff')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  notificationType === 'kickoff'
                    ? 'bg-fifa-gold text-fifa-dark'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                At Kickoff
              </button>
            </div>
          </div>

          {notificationType === 'before' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Minutes Before</label>
              <div className="flex gap-2">
                {[10, 15, 30, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setMinutesBefore(mins)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      minutesBefore === mins
                        ? 'bg-fifa-gold text-fifa-dark'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex-1">
            Set Notification
          </button>
        </div>
      </div>
    </div>
  );
}
