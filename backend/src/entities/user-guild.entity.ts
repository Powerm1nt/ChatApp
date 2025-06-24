import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';
import { Guild } from './guild.entity';

export enum UserGuildRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner'
}

@Entity()
export class UserGuild {
  @PrimaryKey()
  id: string = uuidv4();

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Guild)
  guild!: Guild;

  @Enum(() => UserGuildRole)
  role: UserGuildRole = UserGuildRole.MEMBER;

  @Property()
  joinedAt: Date = new Date();
}