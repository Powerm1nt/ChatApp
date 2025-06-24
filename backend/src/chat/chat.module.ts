import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { User, Guild, Channel, UserGuild, Message } from '../entities';

@Module({
  imports: [
    MikroOrmModule.forFeature([User, Guild, Channel, UserGuild, Message]),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
