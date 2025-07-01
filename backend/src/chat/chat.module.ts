import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { User, Guild, Channel, UserGuild, Message, GuildInvitation, DirectMessage } from '../entities';
import { InvitationModule } from '../invitation/invitation.module';
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([User, Guild, Channel, UserGuild, Message, GuildInvitation, DirectMessage]),
    InvitationModule,
    FriendsModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
