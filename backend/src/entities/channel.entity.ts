import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Guild } from './guild.entity';
import { Message } from './message.entity';

@Entity()
export class Channel {
  @PrimaryKey()
  id: string = uuidv4().split('-')[0];

  @Property()
  name!: string;

  @Property({ nullable: true })
  description?: string;

  @Property()
  createdAt: Date = new Date();

  @ManyToOne(() => Guild)
  guild!: Guild;

  @OneToMany(() => Message, message => message.channel)
  messages = new Collection<Message>(this);
}