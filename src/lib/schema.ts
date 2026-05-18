import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  flag: text('flag'),
  groupId: text('group_id').references(() => groups.id),
});

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  homeTeamId: text('home_team_id').references(() => teams.id).notNull(),
  awayTeamId: text('away_team_id').references(() => teams.id).notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  venue: text('venue'),
  city: text('city'),
  stage: text('stage').notNull(),
  group: text('group'),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  isCompleted: integer('is_completed').default(0),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  matchId: text('match_id').references(() => matches.id).notNull(),
  type: text('type').notNull(),
  minutesBefore: integer('minutes_before').notNull(),
  isActive: integer('is_active').default(1),
});

export type Group = typeof groups.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
