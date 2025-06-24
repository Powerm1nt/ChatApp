import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';
import { Channel } from './channel.entity';

@Entity()
export class Message {
  @PrimaryKey()
  id: string = uuidv4().split('-')[0];

  @Property()
  content!: string;

  @Property()
  timestamp: Date = new Date();

  @ManyToOne(() => User)
  author!: User;

  @ManyToOne(() => Channel)
  channel!: Channel;
}