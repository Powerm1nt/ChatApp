import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Guild } from './guild.entity';
import { User } from './user.entity';

@Entity()
export class GuildInvitation {
  @PrimaryKey()
  id: string = uuidv4().split('-')[0];

  @ManyToOne(() => Guild)
  guild!: Guild;

  @ManyToOne(() => User)
  inviter!: User;

  @ManyToOne(() => User, { nullable: true })
  invitee?: User;

  @Property({ unique: true })
  code!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ nullable: true })
  expiresAt?: Date;

  @Property({ default: false })
  accepted: boolean = false;

  @Property({ nullable: true })
  acceptedAt?: Date;
} 