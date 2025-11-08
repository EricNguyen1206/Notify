import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from "typeorm";
import { Message } from "./Message";
import { Conversation } from "./Conversation";
import { ConversationMember } from "./ConversationMember";
import { Session } from "./Session";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  username!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: false })
  password!: string;

  @Column({ nullable: true })
  avatar?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @OneToMany(() => Message, (message) => message.sender)
  sentMessages!: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages!: Message[];

  @OneToMany(() => Conversation, (conversation) => conversation.owner)
  ownedConversations!: Conversation[];

  @OneToMany(() => ConversationMember, (member) => member.user)
  conversationMemberships!: ConversationMember[];

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];
}
