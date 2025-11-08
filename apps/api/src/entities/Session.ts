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

@Entity("sessions")
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  userId: number;

  @Column({ unique: true, nullable: false, type: "text" })
  refreshToken: string;

  @Column({ type: "timestamp", nullable: false })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: "userId" })
  user: User;

  // Helper method to check if session is expired
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }
}

