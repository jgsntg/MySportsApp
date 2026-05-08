import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';

export const userPreferences = sqliteTable('user_preferences', {
  userId:    text('user_id').primaryKey(),
  prefs:     text('prefs').notNull().default('{}'),
  updatedAt: integer('updated_at').default(0),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  createdAt: integer('created_at').default(0),
});

export const favoriteTeams = sqliteTable(
  'favorite_teams',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    teamId: text('team_id').notNull(),
    sport: text('sport').notNull(),
    league: text('league').notNull(),
    teamName: text('team_name').notNull(),
    teamLogo: text('team_logo'),
    teamColor: text('team_color'),
    createdAt: integer('created_at').default(0),
  },
  (table) => ({
    uniqueUserTeam: unique().on(table.userId, table.teamId, table.sport),
  })
);

export const favoritePlayers = sqliteTable(
  'favorite_players',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    playerId: text('player_id').notNull(),
    sport: text('sport').notNull(),
    league: text('league').notNull(),
    playerName: text('player_name').notNull(),
    playerPhoto: text('player_photo'),
    teamName: text('team_name'),
    position: text('position'),
    sortOrder: integer('sort_order').default(0),
    displayInCommandCenter: integer('display_in_command_center').default(1),
    createdAt: integer('created_at').default(0),
  },
  (table) => ({
    uniqueUserPlayer: unique().on(table.userId, table.playerId, table.sport),
  })
);
