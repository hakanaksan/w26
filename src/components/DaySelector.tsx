'use client';

import { useRef } from 'react';
import { matches } from '@/data/fixtures';

interface DaySelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DaySelector({ selectedDate, onDateChange }: DaySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dates = Array.from(new Set(matches.map(m => m.date))).sort();

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

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      <button onClick={scrollLeft} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors -ml-2">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button onClick={scrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors -mr-2">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
      <div ref={scrollRef} className="overflow-x-auto px-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        <div className="flex gap-2 min-w-max py-1">
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
    </div>
  );
}