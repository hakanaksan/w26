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
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const matchScores = sqliteTable('match_scores', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().unique(),
  homeScore: integer('home_score').notNull(),
  awayScore: integer('away_score').notNull(),
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

export type User = typeof users.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type MatchScore = typeof matchScores.$inferSelect;
export type UserNotification = typeof userNotifications.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;