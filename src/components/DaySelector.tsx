'use client';

import { matches } from '@/data/fixtures';

interface DaySelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DaySelector({ selectedDate, onDateChange }: DaySelectorProps) {
  const dates = [...new Set(matches.map(m => m.date))].sort();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  const getMatchCount = (date: string) => {
    return matches.filter(m => m.date === date).length;
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max">
        {dates.map(date => {
          const { day, weekday, month } = formatDate(date);
          const isSelected = date === selectedDate;
          const matchCount = getMatchCount(date);

          return (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={`flex flex-col items-center px-4 py-3 rounded-xl transition-all min-w-[80px] ${
                isSelected
                  ? 'bg-fifa-gold text-fifa-dark shadow-lg shadow-fifa-gold/30'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-xs font-medium">{weekday}</span>
              <span className="text-2xl font-bold">{day}</span>
              <span className="text-xs">{month}</span>
              <span className={`text-xs mt-1 px-1.5 py-0.5 rounded-full ${
                isSelected ? 'bg-fifa-dark/20' : 'bg-gray-700'
              }`}>
                {matchCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
