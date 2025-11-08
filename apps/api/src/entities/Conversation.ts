import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Message } from "./Message";
import { ConversationMember } from "./ConversationMember";

export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
}

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false })
  ownerId!: number;

  @Column({
    type: "enum",
    enum: ConversationType,
    default: ConversationType.GROUP,
  })
  type!: ConversationType;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.ownedConversations)
  @JoinColumn({ name: "ownerId" })
  owner!: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];

  @OneToMany(() => ConversationMember, (member) => member.conversation)
  members!: ConversationMember[];
}

