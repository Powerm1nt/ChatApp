import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@mikro-orm/nestjs";
import { EntityRepository } from "@mikro-orm/core";
import { GuildInvitation, Guild, User, DirectMessage } from "../entities";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(GuildInvitation)
    private readonly guildInvitationRepository: EntityRepository<GuildInvitation>,
    @InjectRepository(Guild)
    private readonly guildRepository: EntityRepository<Guild>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(DirectMessage)
    private readonly directMessageRepository: EntityRepository<DirectMessage>
  ) {}

  async createGuildInvitation(guildId: string, inviterId: string, inviteeId?: string): Promise<string> {
    const guild = await this.guildRepository.findOneOrFail({ id: guildId });
    const inviter = await this.userRepository.findOneOrFail({ id: inviterId });
    let invitee = undefined;
    if (inviteeId) {
      invitee = await this.userRepository.findOneOrFail({ id: inviteeId });
    }
    const code = uuidv4();
    const invitation = new GuildInvitation();
    invitation.guild = guild;
    invitation.inviter = inviter;
    invitation.invitee = invitee;
    invitation.code = code;
    invitation.createdAt = new Date();
    await this.guildInvitationRepository.persistAndFlush(invitation);
    // Send a direct message if invitee exists
    if (invitee) {
      const directMessage = new DirectMessage();
      directMessage.sender = inviter;
      directMessage.receiver = invitee;
      directMessage.content = `You've been invited to join the guild "${guild.name}"!`;
      await this.directMessageRepository.persistAndFlush(directMessage);
    }
    return code;
  }
} 