import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { User } from "./User";

@Entity("sessions")
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: false })
  @Index("IDX_sessions_userId")
  userId!: string;

  @Column({ unique: true, nullable: false, type: "text" })
  refreshToken!: string;

  @Column({ type: "timestamp", nullable: false })
  @Index("IDX_sessions_expires_at")
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: "userId" })
  user!: User;

  // Helper method to check if session is expired
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }
}
