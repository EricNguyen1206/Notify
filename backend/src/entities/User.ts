import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Chat } from "./Chat";
import { Channel } from "./Channel";
import { ChannelMember } from "./ChannelMember";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  username: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: true })
  avatar?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @OneToMany(() => Chat, (chat) => chat.sender)
  sentMessages: Chat[];

  @OneToMany(() => Chat, (chat) => chat.receiver)
  receivedMessages: Chat[];

  @OneToMany(() => Channel, (channel) => channel.owner)
  ownedChannels: Channel[];

  @OneToMany(() => ChannelMember, (member) => member.user)
  channelMemberships: ChannelMember[];
}
