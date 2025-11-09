import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique, Index } from "typeorm";
import { User } from "./User";
import { Conversation } from "./Conversation";

@Entity("participants")
@Unique(["userId", "conversationId"])
@Index("IDX_participants_user_conversation", ["userId", "conversationId"])
export class Participant {
  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false })
  conversationId: string;

  @CreateDateColumn()
  joinedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.participants)
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.participants)
  @JoinColumn({ name: "conversationId" })
  conversation!: Conversation;

  constructor(userId: string, conversationId: string) {
    this.userId = userId;
    this.conversationId = conversationId;
    this.joinedAt = new Date();
  }
}
