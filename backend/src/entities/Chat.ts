import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Channel } from "./Channel";

export enum ChatType {
  DIRECT = "direct",
  CHANNEL = "group",
}

@Entity("chats")
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  senderId: number;

  @Column({ nullable: true })
  receiverId?: number;

  @Column({ nullable: true })
  channelId?: number;

  @Column({ type: "text", nullable: true })
  text?: string;

  @Column({ nullable: true })
  url?: string;

  @Column({ nullable: true })
  fileName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: "senderId" })
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedMessages)
  @JoinColumn({ name: "receiverId" })
  receiver?: User;

  @ManyToOne(() => Channel, (channel) => channel.messages)
  @JoinColumn({ name: "channelId" })
  channel?: Channel;

  // Helper method to get chat type
  getType(): ChatType {
    if (this.receiverId) {
      return ChatType.DIRECT;
    }
    if (this.channelId) {
      return ChatType.CHANNEL;
    }
    throw new Error("Invalid chat: must have either receiverId or channelId");
  }
}
