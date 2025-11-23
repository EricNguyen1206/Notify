import {
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  JoinColumn,
  Entity,
  ManyToOne,
  Unique,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('friends')
@Unique(['userId', 'friendId'])
@Index('IDX_friends_user_friend', ['userId', 'friendId'])
export class Friends {
  @Column({ nullable: false })
  userId!: string;

  @Column({ nullable: false })
  friendId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'friendId' })
  friend!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  sortIds() {
    if (this.userId > this.friendId) {
      const temp = this.userId;
      this.userId = this.friendId;
      this.friendId = temp;
    }
  }
}
