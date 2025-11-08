import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./User";
import { Conversation } from "./Conversation";

@Entity("conversation_members")
@Unique(["userId", "conversationId"])
export class ConversationMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  userId!: number;

  @Column({ nullable: false })
  conversationId!: number;

  @CreateDateColumn()
  joinedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.conversationMemberships)
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.members)
  @JoinColumn({ name: "conversationId" })
  conversation!: Conversation;
}

