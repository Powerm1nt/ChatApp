import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { User, FriendRequest, FriendRequestStatus } from "../entities";

@Injectable()
export class FriendsService {
  constructor(private readonly em: EntityManager) {}

  async sendFriendRequest(senderId: string, receiverUsername: string) {
    const sender = await this.em.findOne(User, { id: senderId });
    if (!sender) {
      throw new NotFoundException("Sender not found");
    }

    const receiver = await this.em.findOne(User, {
      username: receiverUsername,
    });
    if (!receiver) {
      throw new NotFoundException("User not found");
    }

    if (sender.id === receiver.id) {
      throw new BadRequestException("Cannot send friend request to yourself");
    }

    // Check if they are already friends
    if (sender.friends.includes(receiver.id)) {
      throw new ConflictException("You are already friends with this user");
    }

    // Check if there's already a pending request
    const existingRequest = await this.em.findOne(FriendRequest, {
      $or: [
        {
          sender: sender.id,
          receiver: receiver.id,
          status: FriendRequestStatus.PENDING,
        },
        {
          sender: receiver.id,
          receiver: sender.id,
          status: FriendRequestStatus.PENDING,
        },
      ],
    });

    if (existingRequest) {
      throw new ConflictException("Friend request already exists");
    }

    const friendRequest = new FriendRequest();
    friendRequest.sender = sender;
    friendRequest.receiver = receiver;

    await this.em.persistAndFlush(friendRequest);

    return {
      message: `Friend request sent to ${receiverUsername}`,
      request: {
        id: friendRequest.id,
        receiver: {
          id: receiver.id,
          username: receiver.username,
        },
        status: friendRequest.status,
        createdAt: friendRequest.createdAt,
      },
    };
  }

  async getReceivedFriendRequests(userId: string) {
    const requests = await this.em.find(
      FriendRequest,
      { receiver: userId, status: FriendRequestStatus.PENDING },
      { populate: ["sender"] }
    );

    return requests.map((request) => ({
      id: request.id,
      sender: {
        id: request.sender.id,
        username: request.sender.username,
      },
      status: request.status,
      createdAt: request.createdAt,
    }));
  }

  async getSentFriendRequests(userId: string) {
    const requests = await this.em.find(
      FriendRequest,
      { sender: userId, status: FriendRequestStatus.PENDING },
      { populate: ["receiver"] }
    );

    return requests.map((request) => ({
      id: request.id,
      receiver: {
        id: request.receiver.id,
        username: request.receiver.username,
      },
      status: request.status,
      createdAt: request.createdAt,
    }));
  }

  async acceptFriendRequest(userId: string, requestId: string) {
    const request = await this.em.findOne(
      FriendRequest,
      { id: requestId, receiver: userId, status: FriendRequestStatus.PENDING },
      { populate: ["sender", "receiver"] }
    );

    if (!request) {
      throw new NotFoundException("Friend request not found");
    }

    // Update request status
    request.status = FriendRequestStatus.ACCEPTED;

    // Add each other as friends
    const sender = request.sender;
    const receiver = request.receiver;

    if (!sender.friends.includes(receiver.id)) {
      sender.friends.push(receiver.id);
    }
    if (!receiver.friends.includes(sender.id)) {
      receiver.friends.push(sender.id);
    }

    await this.em.persistAndFlush([request, sender, receiver]);

    return {
      message: `Friend request accepted`,
      friend: {
        id: sender.id,
        username: sender.username,
      },
    };
  }

  async declineFriendRequest(userId: string, requestId: string) {
    const request = await this.em.findOne(
      FriendRequest,
      { id: requestId, receiver: userId, status: FriendRequestStatus.PENDING },
      { populate: ["sender"] }
    );

    if (!request) {
      throw new NotFoundException("Friend request not found");
    }

    request.status = FriendRequestStatus.DECLINED;
    await this.em.persistAndFlush(request);

    return {
      message: "Friend request declined",
    };
  }

  async cancelFriendRequest(userId: string, requestId: string) {
    const request = await this.em.findOne(FriendRequest, {
      id: requestId,
      sender: userId,
      status: FriendRequestStatus.PENDING,
    });

    if (!request) {
      throw new NotFoundException("Friend request not found");
    }

    await this.em.removeAndFlush(request);

    return {
      message: "Friend request cancelled",
    };
  }

  async getFriends(userId: string) {
    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.friends.length === 0) {
      return [];
    }

    const friends = await this.em.find(User, { id: { $in: user.friends } });

    return friends.map((friend) => ({
      id: friend.id,
      username: friend.username,
      email: friend.email,
      status: "offline", //TODO: hardcoded status here
    }));
  }

  async removeFriend(userId: string, friendId: string) {
    const user = await this.em.findOne(User, { id: userId });
    const friend = await this.em.findOne(User, { id: friendId });

    if (!user || !friend) {
      throw new NotFoundException("User not found");
    }

    if (!user.friends.includes(friendId)) {
      throw new BadRequestException("This user is not your friend");
    }

    // Remove from both users' friend lists
    user.friends = user.friends.filter((id) => id !== friendId);
    friend.friends = friend.friends.filter((id) => id !== userId);

    await this.em.persistAndFlush([user, friend]);

    return {
      message: "Friend removed successfully",
    };
  }
}
