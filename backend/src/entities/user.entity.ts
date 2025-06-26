import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  ManyToMany,
  Collection,
} from "@mikro-orm/core";
import { v4 as uuidv4 } from "uuid";
import { UserGuild } from "./user-guild.entity";
import { Message } from "./message.entity";
import { FriendRequest } from "./friend-request.entity";
import { Group } from "./group.entity";
import { GroupMessage } from "./group-message.entity";
import { DirectMessage } from "./direct-message.entity";

@Entity()
export class User {
  @PrimaryKey()
  id: string = uuidv4().split("-")[0];

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

  @Property({ default: "online" })
  status: "online" | "dnd" | "inactive" | "offline" = "online";

  @Property({ type: "json", default: "[]" })
  friends: string[] = [];

  @OneToMany(() => UserGuild, (userGuild) => userGuild.user)
  guilds = new Collection<UserGuild>(this);

  @OneToMany(() => Message, (message) => message.author)
  messages = new Collection<Message>(this);

  @OneToMany(() => FriendRequest, (friendRequest) => friendRequest.sender)
  sentFriendRequests = new Collection<FriendRequest>(this);

  @OneToMany(() => FriendRequest, (friendRequest) => friendRequest.receiver)
  receivedFriendRequests = new Collection<FriendRequest>(this);

  @ManyToMany(() => Group, (group) => group.members, { owner: true })
  groups = new Collection<Group>(this);

  @OneToMany(() => GroupMessage, (message) => message.author)
  groupMessages = new Collection<GroupMessage>(this);

  @OneToMany(() => DirectMessage, (message) => message.sender)
  sentDirectMessages = new Collection<DirectMessage>(this);

  @OneToMany(() => DirectMessage, (message) => message.receiver)
  receivedDirectMessages = new Collection<DirectMessage>(this);
}
