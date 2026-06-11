export function getMatchStatus(match: { isCompleted?: boolean; homeScore?: number; awayScore?: number }): {
  hasScore: boolean;
  isCompleted: boolean;
  isLive: boolean;
} {
  const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;
  const isCompleted = match.isCompleted === true;
  const isLive = !isCompleted && hasScore;
  return { hasScore, isCompleted, isLive };
}