import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity("purchase_sessions")
export class PurchaseSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  total!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  estimatedTotal!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  difference!: number;

  @Column({ type: "json" })
  items: unknown[] = [];

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.purchaseSessions, { onDelete: "CASCADE" })
  user!: User;
}
