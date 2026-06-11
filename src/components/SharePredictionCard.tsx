'use client';

import { useRef, useCallback } from 'react';

interface SharePredictionCardProps {
  userName: string;
  predictions: Record<string, { homeScore: number; awayScore: number }>;
  matches: { id: string; homeTeamId: string; awayTeamId: string; date: string; stage: string; group?: string }[];
  exact: number;
  outcome: number;
  goalCount: number;
  points: number;
}

export default function SharePredictionCard({ userName, predictions, matches, exact, outcome, goalCount, points }: SharePredictionCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleShare = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 600;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1e40af');
    grad.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('2026 FIFA Dünya Kupası', 24, 45);

    ctx.fillStyle = '#93c5fd';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Tahminlerim', 24, 70);

    ctx.fillStyle = '#1e293b';
    const predIds = Object.keys(predictions).slice(0, 5);
    let y = 100;

    const total = exact + outcome + goalCount;
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${userName}`, 24, y);
    y += 28;

    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${total} tahmin • ${exact} tam • ${outcome} sonuç • ${goalCount} gol • ${points} puan`, 24, y);
    y += 36;

    predIds.forEach(matchId => {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;
      const pred = predictions[matchId];

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(24, y - 4, width - 48, 42);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(24, y - 4, width - 48, 42);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      const homeShort = match.homeTeamId;
      const awayShort = match.awayTeamId;
      ctx.fillText(`${homeShort}`, 36, y + 18);

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pred.homeScore} - ${pred.awayScore}`, width / 2, y + 20);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${awayShort}`, width - 36, y + 18);

      y += 52;
    });

    ctx.fillStyle = '#475569';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('worldcup2026.app', width / 2, height - 16);

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tahminlerim-wc2026.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [userName, predictions, matches, exact, outcome, goalCount, points]);

  if (Object.keys(predictions).length === 0) return null;

  return (
    <div>
      <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/50">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        Tahminlerini Paylaş
      </button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}