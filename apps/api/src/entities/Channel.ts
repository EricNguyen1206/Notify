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
import { ChannelMember } from "./ChannelMember";

export enum ChannelType {
  DIRECT = "direct",
  GROUP = "group",
}

@Entity("channels")
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  ownerId: number;

  @Column({
    type: "enum",
    enum: ChannelType,
    default: ChannelType.GROUP,
  })
  type: ChannelType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.ownedChannels)
  @JoinColumn({ name: "ownerId" })
  owner: User;

  @OneToMany(() => Message, (message) => message.channel)
  messages: Message[];

  @OneToMany(() => ChannelMember, (member) => member.channel)
  members: ChannelMember[];
}
