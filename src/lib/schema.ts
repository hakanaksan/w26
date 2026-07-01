import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
});

export const predictions = sqliteTable('predictions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  matchId: text('match_id').notNull(),
  homeScore: integer('home_score').notNull(),
  awayScore: integer('away_score').notNull(),
  homePenaltyScore: integer('home_penalty_score'),
  awayPenaltyScore: integer('away_penalty_score'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const matchScores = sqliteTable('match_scores', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().unique(),
  homeScore: integer('home_score').notNull(),
  awayScore: integer('away_score').notNull(),
  homePenaltyScore: integer('home_penalty_score'),
  awayPenaltyScore: integer('away_penalty_score'),
  isCompleted: integer('is_completed').default(0),
  updatedAt: text('updated_at').notNull(),
});

export const userNotifications = sqliteTable('user_notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  matchId: text('match_id').notNull(),
  type: text('type').notNull(),
  minutesBefore: integer('minutes_before').notNull(),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').notNull(),
});

export const favorites = sqliteTable('favorites', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  matchId: text('match_id').notNull(),
  createdAt: text('created_at').notNull(),
});

export const scorers = sqliteTable('scorers', {
  id: text('id').primaryKey(),
  matchId: text('match_id').references(() => matchScores.matchId).notNull(),
  teamId: text('team_id').notNull(),
  playerName: text('player_name').notNull(),
  minute: integer('minute'),
  isPenalty: integer('is_penalty').default(0),
  isOwnGoal: integer('is_own_goal').default(0),
  createdAt: text('created_at').notNull(),
});

export const leagues = sqliteTable('leagues', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  ownerId: text('owner_id').references(() => users.id).notNull(),
  createdAt: text('created_at').notNull(),
});

export const leagueMembers = sqliteTable('league_members', {
  id: text('id').primaryKey(),
  leagueId: text('league_id').references(() => leagues.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  joinedAt: text('joined_at').notNull(),
});

export type User = typeof users.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type MatchScore = typeof matchScores.$inferSelect;
export type UserNotification = typeof userNotifications.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Scorer = typeof scorers.$inferSelect;
export type League = typeof leagues.$inferSelect;
export type LeagueMember = typeof leagueMembers.$inferSelect;