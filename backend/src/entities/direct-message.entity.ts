import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';

@Entity()
export class DirectMessage {
  @PrimaryKey()
  id: string = uuidv4();

  @Property()
  content!: string;

  @Property()
  timestamp: Date = new Date();

  @ManyToOne(() => User)
  sender!: User;

  @ManyToOne(() => User)
  receiver!: User;

  @Property({ default: false })
  isRead: boolean = false;
}