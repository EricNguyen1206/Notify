import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./User";
import { Channel } from "./Channel";

@Entity("channel_members")
@Unique(["userId", "channelId"])
export class ChannelMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  channelId: number;

  @CreateDateColumn()
  joinedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.channelMemberships)
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Channel, (channel) => channel.members)
  @JoinColumn({ name: "channelId" })
  channel: Channel;
}
