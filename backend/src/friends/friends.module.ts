import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { User, FriendRequest } from '../entities';

@Module({
  imports: [MikroOrmModule.forFeature([User, FriendRequest])],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}