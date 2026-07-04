'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getTeam, getFlagUrl } from '@/data/teams';
import type { Match } from '@/data/fixtures';
import { getMatchStatus } from '@/lib/match-status';

interface MatchCardProps {
  match: Match;
  prediction?: { homeScore: number; awayScore: number; homePenaltyScore?: number; awayPenaltyScore?: number } | null;
  onScoreUpdate?: (matchId: string, homeScore: number, awayScore: number) => void;
  onPredict?: (matchId: string, homeScore: number, awayScore: number, homePenaltyScore?: number, awayPenaltyScore?: number) => void;
  onNotify?: (matchId: string) => void;
  onClearScore?: (matchId: string) => void;
  onDeletePrediction?: (matchId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (matchId: string) => void;
}

function FlagImg({ code, size = 'w-16 h-11' }: { code: string; size?: string }) {
  if (code === 'TBD' || !code) {
    return <div className={`${size} bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl shadow-inner`}>❓</div>;
  }
  const team = getTeam(code);
  const src = team.flag || getFlagUrl(code) || '';
  if (!src) return <div className={`${size} bg-gray-200 dark:bg-gray-700 rounded-xl shadow-inner flex items-center justify-center text-xs text-gray-400`}>{code}</div>;
  return (
    <Link href={`/team/${code}`}>
      <img src={src} alt={team.name} className={`${size} rounded-xl shadow-inner object-cover hover:opacity-80 transition-opacity cursor-pointer`} />
    </Link>
  );
}

export function MiniMatchCard({ match }: { match: Match }) {
  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);
  const { hasScore, isCompleted, isLive } = getMatchStatus(match);

  return (
    <a href={`/match/${match.id}`} className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{match.date}</span>
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{match.time} TR</span>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <span>{match.venue}, {match.city}</span>
        <span className="font-semibold text-gray-600 dark:text-gray-400">{match.country}</span>
      </div>
      {hasScore ? (
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <img src={home.flag || getFlagUrl(match.homeTeamId)} alt={home.name} className="w-8 h-6 rounded object-cover" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">{home.name}</span>
            </div>
            <div className="px-3">
              <span className="text-xl font-black text-gray-900 dark:text-white">{match.homeScore} - {match.awayScore}</span>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">{away.name}</span>
              <img src={away.flag || getFlagUrl(match.awayTeamId)} alt={away.name} className="w-8 h-6 rounded object-cover" />
            </div>
          </div>
          {isCompleted ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 text-center">Maç Bitti</p>
          ) : isLive ? (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <p className="text-xs text-red-600 dark:text-red-400 font-bold">CANLI</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <img src={home.flag || getFlagUrl(match.homeTeamId)} alt={home.name} className="w-8 h-6 rounded object-cover" />
            <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">{home.name}</span>
          </div>
          <div className="px-3 text-gray-400 dark:text-gray-500 font-bold text-lg">vs</div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">{away.name}</span>
            <img src={away.flag || getFlagUrl(match.awayTeamId)} alt={away.name} className="w-8 h-6 rounded object-cover" />
          </div>
        </div>
      )}
    </a>
  );
}

export default function MatchCard({ match, prediction, onScoreUpdate, onPredict, onNotify, onClearScore, onDeletePrediction, isFavorite, onToggleFavorite }: MatchCardProps) {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [homePred, setHomePred] = useState(prediction ? String(prediction.homeScore) : '');
  const [awayPred, setAwayPred] = useState(prediction ? String(prediction.awayScore) : '');
  const [homePenPred, setHomePenPred] = useState(prediction?.homePenaltyScore !== undefined && prediction?.homePenaltyScore !== null ? String(prediction.homePenaltyScore) : '');
  const [awayPenPred, setAwayPenPred] = useState(prediction?.awayPenaltyScore !== undefined && prediction?.awayPenaltyScore !== null ? String(prediction.awayPenaltyScore) : '');
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [isEditingPred, setIsEditingPred] = useState(false);

  const homeTeam = getTeam(match.homeTeamId);
  const awayTeam = getTeam(match.awayTeamId);
  const { hasScore, isCompleted, isLive } = getMatchStatus(match);

  const getStageStyle = (stage: string) => {
    switch (stage) {
      case 'Final': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Yarı Final': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'Çeyrek Final': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'Son 16': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Son 32': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
      case 'Üçüncülük': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleScoreSave = () => {
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0 || h > 99 || a > 99) return;
    onScoreUpdate?.(match.id, h, a);
    setIsEditingScore(false);
  };

  const handlePredSave = () => {
    const h = parseInt(homePred);
    const a = parseInt(awayPred);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0 || h > 99 || a > 99) return;

    let hPen: number | undefined;
    let aPen: number | undefined;
    if (h === a && match.stage !== 'Grup') {
      hPen = parseInt(homePenPred);
      aPen = parseInt(awayPenPred);
      if (isNaN(hPen) || isNaN(aPen) || hPen < 0 || aPen < 0 || hPen === aPen) {
        alert('Penaltılarda kazananı belirlemek için farklı skorlar girmelisiniz.');
        return;
      }
    }

    onPredict?.(match.id, h, a, hPen, aPen);
    setIsEditingPred(false);
  };

  return (
    <div className="match-card relative">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => onToggleFavorite ? onToggleFavorite(match.id) : undefined}
          className={`text-lg transition-all ${isFavorite ? 'text-yellow-500 scale-110' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`}
          title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          {isFavorite ? '⭐' : '☆'}
        </button>
      </div>

      <a href={`/match/${match.id}`} className="block hover:opacity-[0.97] transition-opacity">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`stage-badge border ${getStageStyle(match.stage)}`}>{match.stage}</span>
          </div>
          {match.group && !isFavorite && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg mr-8">{match.group}. Grup</span>
          )}
          {match.group && isFavorite && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">{match.group}. Grup</span>
          )}
        </div>

        <div className="flex items-center justify-between py-4">
          <div className="flex-1 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2 min-w-[80px]">
              <FlagImg code={match.homeTeamId} />
              <Link href={`/team/${match.homeTeamId}`} className="font-bold text-gray-900 dark:text-white text-sm text-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{homeTeam.name}</Link>
            </div>

            <div className="px-2 flex-shrink-0">
              {hasScore ? (
                <div className="text-center">
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{match.homeScore} - {match.awayScore}</p>
                  {isCompleted ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Maç Bitti</p>
                  ) : isLive ? (
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <p className="text-xs text-red-600 dark:text-red-400 font-bold">CANLI</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Skor girildi</p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{match.time}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Başlangıç
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium ml-1">TR</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 min-w-[80px]">
              <FlagImg code={match.awayTeamId} />
              <Link href={`/team/${match.awayTeamId}`} className="font-bold text-gray-900 dark:text-white text-sm text-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{awayTeam.name}</Link>
            </div>
          </div>
        </div>
      </a>

      {prediction && !isCompleted && (
        <div className="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between text-sm">
          <span className="text-amber-700 dark:text-amber-400 font-medium">🎯 Tahminin:</span>
          <div className="flex items-center gap-2">
            <a href={`/match/${match.id}`} className="font-bold text-amber-800 dark:text-amber-300 hover:underline">
              {prediction.homeScore} - {prediction.awayScore}
              {prediction.homeScore === prediction.awayScore && prediction.homePenaltyScore !== undefined && prediction.awayPenaltyScore !== undefined && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-normal ml-1">
                  (Pen: {prediction.homePenaltyScore} - {prediction.awayPenaltyScore})
                </span>
              )}
            </a>
            {onDeletePrediction && (
              <button onClick={() => onDeletePrediction(match.id)} className="text-red-400 hover:text-red-600 text-xs underline ml-2">Sil</button>
            )}
          </div>
        </div>
      )}

      {isCompleted && prediction && (
        <div className="mb-3 px-3 py-2 rounded-lg flex items-center justify-between text-sm border border-gray-200 dark:border-gray-600">
          <span className="font-medium text-gray-700 dark:text-gray-300">🎯 Tahminin:</span>
          <div className="flex items-center gap-2">
            <span className={prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-500 dark:text-red-400 font-bold'}>
              {prediction.homeScore} - {prediction.awayScore}
              {prediction.homeScore === prediction.awayScore && prediction.homePenaltyScore !== undefined && prediction.awayPenaltyScore !== undefined && (
                <span className="text-xs font-normal ml-1">(Pen: {prediction.homePenaltyScore} - {prediction.awayPenaltyScore})</span>
              )}
            </span>
            {prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore ? (
              <span className="text-green-600 dark:text-green-400 text-xs font-medium bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded">✓ Tam isabet!</span>
            ) : prediction.homeScore === match.homeScore || prediction.awayScore === match.awayScore ? (
              <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 px-2 py-0.5 rounded">~ Yakın</span>
            ) : (
              <span className="text-red-500 dark:text-red-400 text-xs font-medium bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded">✗ Isabet yok</span>
            )}
            {onDeletePrediction && (
              <button onClick={() => onDeletePrediction(match.id)} className="text-red-400 hover:text-red-600 text-xs underline ml-1">Sil</button>
            )}
          </div>
        </div>
      )}

      {isEditingScore && (
        <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Skor Gir</p>
          <div className="flex items-center gap-2 justify-center">
            <input type="number" min="0" max="99" value={homeScore} onChange={e => setHomeScore(e.target.value)} className="input-field w-16 text-center text-xl font-bold" placeholder="0" />
            <span className="text-gray-400 dark:text-gray-500 text-xl">:</span>
            <input type="number" min="0" max="99" value={awayScore} onChange={e => setAwayScore(e.target.value)} className="input-field w-16 text-center text-xl font-bold" placeholder="0" />
          </div>
          <div className="flex gap-2 mt-2 justify-center">
            <button onClick={handleScoreSave} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700">Kaydet</button>
            <button onClick={() => setIsEditingScore(false)} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500">İptal</button>
          </div>
        </div>
      )}

      {isEditingPred && (
        <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">🎯 Tahminini Gir</p>
          <div className="flex items-center gap-2 justify-center">
            <input type="number" min="0" max="99" value={homePred} onChange={e => setHomePred(e.target.value)} className="input-field w-16 text-center text-xl font-bold" placeholder="0" />
            <span className="text-gray-400 dark:text-gray-500 text-xl">:</span>
            <input type="number" min="0" max="99" value={awayPred} onChange={e => setAwayPred(e.target.value)} className="input-field w-16 text-center text-xl font-bold" placeholder="0" />
          </div>
          {homePred !== '' && awayPred !== '' && parseInt(homePred) === parseInt(awayPred) && match.stage !== 'Grup' && (
            <div className="flex flex-col items-center gap-1.5 p-3 bg-amber-100/50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-xl mt-3 max-w-[200px] mx-auto">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Penaltı Atışları</span>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="99" value={homePenPred} onChange={e => setHomePenPred(e.target.value)} className="input-field w-12 text-center text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-1" placeholder="P" />
                <span className="text-sm font-bold text-gray-400">-</span>
                <input type="number" min="0" max="99" value={awayPenPred} onChange={e => setAwayPenPred(e.target.value)} className="input-field w-12 text-center text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-1" placeholder="P" />
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-2 justify-center">
            <button onClick={handlePredSave} className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-600">Kaydet</button>
            <button onClick={() => setIsEditingPred(false)} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500">İptal</button>
          </div>
        </div>
      )}

      {!onScoreUpdate && !isCompleted && !onPredict && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 text-center">
          Skor girmek ve tahmin yapmak için <a href="/auth/login" className="font-semibold underline">giriş yapın</a>
        </div>
      )}

      <a href={`/match/${match.id}`} className="block mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:opacity-80 transition-opacity">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {formatDate(match.date)}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {match.time}
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">TR</span>
          </span>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-gray-700 dark:text-gray-300 font-medium">{match.venue}</span>
          </span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="text-gray-600 dark:text-gray-400">{match.city}</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="text-gray-700 dark:text-gray-300 font-semibold">{match.country}</span>
        </div>
      </a>

      <div className="mt-3 flex gap-2 flex-wrap">
        {!isCompleted && onPredict && !isEditingPred && (
          match.homeTeamId === 'TBD' || match.awayTeamId === 'TBD' ? (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic bg-gray-50/50 dark:bg-gray-800/35 px-3 py-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              Takımlar bekleniyor
            </span>
          ) : (
            <button onClick={() => setIsEditingPred(true)} className="btn-primary flex items-center gap-1 text-sm">
              🎯 Tahmin Et
            </button>
          )
        )}
        {onScoreUpdate && !isEditingScore && !isCompleted && (
          <button onClick={() => setIsEditingScore(true)} className="btn-secondary text-sm flex items-center gap-1">
            ✏️ Skor Gir
          </button>
        )}
        {isCompleted && onClearScore && (
          <button onClick={() => onClearScore(match.id)} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1">
            🗑️ Skoru Sil
          </button>
        )}
        {onNotify && !isCompleted && (
          <button onClick={() => onNotify(match.id)} className="btn-secondary text-sm flex items-center gap-1">
            🔔 Hatırlat
          </button>
        )}
        <a href={`/match/${match.id}`} className="btn-secondary text-sm flex items-center gap-1">
          📋 Detay
        </a>
      </div>
    </div>
  );
}