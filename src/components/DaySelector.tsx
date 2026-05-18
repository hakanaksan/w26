'use client';

import { matches } from '@/data/fixtures';

interface DaySelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DaySelector({ selectedDate, onDateChange }: DaySelectorProps) {
  const dates = [...new Set(matches.map(m => m.date))].sort();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
      month: date.toLocaleDateString('tr-TR', { month: 'short' }),
    };
  };

  const getMatchCount = (date: string) => {
    return matches.filter(m => m.date === date).length;
  };

  const getStageLabel = (date: string) => {
    const dayMatches = matches.filter(m => m.date === date);
    if (dayMatches.length === 0) return '';
    const stage = dayMatches[0].stage;
    if (stage.includes('Final')) return '🏆';
    if (stage.includes('Yarı')) return '⚡';
    if (stage.includes('Çeyrek')) return '🔥';
    if (stage.includes('Son')) return '⚽';
    return '🏟️';
  };

  return (
    <div className="overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex gap-2 min-w-max">
        {dates.map(date => {
          const { day, weekday, month } = formatDate(date);
          const isSelected = date === selectedDate;
          const matchCount = getMatchCount(date);
          const stageIcon = getStageLabel(date);

          return (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={`flex flex-col items-center px-4 py-3 rounded-2xl transition-all min-w-[88px] ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="text-xs font-medium opacity-70">{weekday}</span>
              <span className="text-2xl font-bold">{day}</span>
              <span className="text-xs opacity-70">{month}</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs">{stageIcon}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {matchCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
