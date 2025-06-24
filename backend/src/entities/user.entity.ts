import { Entity, PrimaryKey, Property, OneToMany, Collection } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { UserGuild } from './user-guild.entity';
import { Message } from './message.entity';

@Entity()
export class User {
  @PrimaryKey()
  id: string = uuidv4();

  @Property({ unique: true })
  email!: string;

  @Property({ nullable: true })
  username?: string;

  @Property()
  password!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ default: false })
  isAnonymous: boolean = false;

  @OneToMany(() => UserGuild, userGuild => userGuild.user)
  guilds = new Collection<UserGuild>(this);

  @OneToMany(() => Message, message => message.author)
  messages = new Collection<Message>(this);
}