import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { User, Guild, Channel, UserGuild, Message, FriendRequest, Group, GroupMessage, DirectMessage, GuildInvitation } from './entities';

const config: Options<PostgreSqlDriver> = {
  entities: [User, Guild, Channel, UserGuild, Message, FriendRequest, Group, GroupMessage, DirectMessage, GuildInvitation],
  dbName: process.env.DB_NAME || 'chatapp',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  driver: PostgreSqlDriver,
  debug: process.env.NODE_ENV !== 'production',
  ensureDatabase: true,
  schemaGenerator: {
    disableForeignKeys: false,
    createForeignKeyConstraints: true,
  },
  allowGlobalContext: true,
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
  },
};

export default config;