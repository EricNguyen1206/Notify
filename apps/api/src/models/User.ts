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
import { Session } from "./Session";
import { Participant } from "./Participant";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

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

  @OneToMany(() => Conversation, (conversation) => conversation.owner)
  ownedConversations!: Conversation[];

  @OneToMany(() => Participant, (participant) => participant.user)
  participants!: Participant[];

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];
}
