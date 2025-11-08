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
import { Conversation } from "./Conversation";

export enum MessageType {
  DIRECT = "direct",
  CHANNEL = "group",
}

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  senderId!: number;

  @Column({ nullable: true })
  receiverId?: number;

  @Column({ nullable: true })
  conversationId?: number;

  @Column({ type: "text", nullable: true })
  text?: string;

  @Column({ nullable: true })
  url?: string;

  @Column({ nullable: true })
  fileName?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: "senderId" })
  sender!: User;

  @ManyToOne(() => User, (user) => user.receivedMessages)
  @JoinColumn({ name: "receiverId" })
  receiver?: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  @JoinColumn({ name: "conversationId" })
  conversation?: Conversation;

  // Helper method to get message type
  getType(): MessageType {
    if (this.receiverId) {
      return MessageType.DIRECT;
    }
    if (this.conversationId) {
      return MessageType.CHANNEL;
    }
    throw new Error("Invalid message: must have either receiverId or conversationId");
  }
}

