import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InvitationService } from './invitation.service';
import { GuildInvitation, Guild, User } from '../entities';

@Module({
  imports: [
    MikroOrmModule.forFeature([GuildInvitation, Guild, User]),
  ],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {} 