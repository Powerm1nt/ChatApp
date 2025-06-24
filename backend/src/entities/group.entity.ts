import { Entity, PrimaryKey, Property, OneToMany, ManyToMany, Collection } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';
import { GroupMessage } from './group-message.entity';

@Entity()
export class Group {
  @PrimaryKey()
  id: string = uuidv4().split('-')[0];

  @Property()
  name!: string;

  @Property({ nullable: true })
  description?: string;

  @Property()
  createdAt: Date = new Date();

  @ManyToMany(() => User, user => user.groups)
  members = new Collection<User>(this);

  @OneToMany(() => GroupMessage, message => message.group)
  messages = new Collection<GroupMessage>(this);
}