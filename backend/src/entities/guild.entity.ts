import { Entity, PrimaryKey, Property, OneToMany, Collection, Cascade } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Channel } from './channel.entity';
import { UserGuild } from './user-guild.entity';

@Entity()
export class Guild {
  @PrimaryKey()
  id: string = uuidv4().split('-')[0];

  @Property()
  name!: string;

  @Property({ nullable: true })
  description?: string;

  @Property()
  createdAt: Date = new Date();

  @OneToMany(() => Channel, channel => channel.guild, { cascade: [Cascade.REMOVE] })
  channels = new Collection<Channel>(this);

  @OneToMany(() => UserGuild, userGuild => userGuild.guild, { cascade: [Cascade.REMOVE] })
  members = new Collection<UserGuild>(this);
}