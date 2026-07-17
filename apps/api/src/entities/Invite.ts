import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity("invites")
export class Invite {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Index({ unique: true })
  @Column({ type: "char", length: 64 })
  tokenHash!: string;

  @Column({ type: "datetime", nullable: true })
  usedAt?: Date | null;

  @Column({ type: "datetime", nullable: true })
  revokedAt?: Date | null;

  @Column({ type: "datetime", nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  usedBy?: User | null;
}
