import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  Unique,
  Index,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

export enum FriendRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

@Entity("friend_requests")
@Unique(["fromUserId", "toUserId"])
@Index("IDX_friend_requests_user_friend", ["fromUserId", "toUserId"])
@Index("IDX_friend_requests_status", ["status"])
export class FriendRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: false })
  fromUserId!: string;

  @Column({ nullable: false })
  toUserId!: string;

  @Column({
    type: "enum",
    enum: FriendRequestStatus,
    default: FriendRequestStatus.PENDING,
  })
  status!: FriendRequestStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: "fromUserId" })
  fromUser!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "toUserId" })
  toUser!: User;
}
