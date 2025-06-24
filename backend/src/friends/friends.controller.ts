import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FriendsService } from './friends.service';

@Controller('api/friends')
@UseGuards(AuthGuard('jwt'))
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  async sendFriendRequest(
    @Request() req,
    @Body() body: { username: string },
  ) {
    const { username } = body;
    
    if (!username || !username.trim()) {
      throw new BadRequestException('Username is required');
    }

    return this.friendsService.sendFriendRequest(req.user.id, username.trim());
  }

  @Get('requests/received')
  async getReceivedFriendRequests(@Request() req) {
    return this.friendsService.getReceivedFriendRequests(req.user.id);
  }

  @Get('requests/sent')
  async getSentFriendRequests(@Request() req) {
    return this.friendsService.getSentFriendRequests(req.user.id);
  }

  @Put('requests/:requestId/accept')
  async acceptFriendRequest(
    @Request() req,
    @Param('requestId') requestId: string,
  ) {
    return this.friendsService.acceptFriendRequest(req.user.id, requestId);
  }

  @Put('requests/:requestId/decline')
  async declineFriendRequest(
    @Request() req,
    @Param('requestId') requestId: string,
  ) {
    return this.friendsService.declineFriendRequest(req.user.id, requestId);
  }

  @Delete('requests/:requestId')
  async cancelFriendRequest(
    @Request() req,
    @Param('requestId') requestId: string,
  ) {
    return this.friendsService.cancelFriendRequest(req.user.id, requestId);
  }

  @Get()
  async getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.id);
  }

  @Delete(':friendId')
  async removeFriend(
    @Request() req,
    @Param('friendId') friendId: string,
  ) {
    return this.friendsService.removeFriend(req.user.id, friendId);
  }
}