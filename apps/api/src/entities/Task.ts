import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

export type TaskPriority = "low" | "medium" | "high";
export type TaskRecurrence = "none" | "daily" | "weekly" | "monthly";
export type TaskWeight = "simples" | "medio" | "pesado";
export type TaskStatus = "pending" | "done";

@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", default: "simples" })
  weight!: TaskWeight;

  @Column({ type: "int", default: 1 })
  mentalEffort!: number;

  @Column({ type: "int", default: 1 })
  domesticImpact!: number;

  @Column({ type: "varchar", default: "medium" })
  priority!: TaskPriority;

  @Column({ type: "varchar", default: "none" })
  recurrence!: TaskRecurrence;

  @Column({ type: "date", nullable: true })
  dueDate?: string;

  @Column({ type: "json", nullable: true })
  scheduledDays?: string[];

  @Column({ type: "json", nullable: true })
  completedDates?: string[];

  @Column({ type: "varchar", default: "09:00" })
  agendaTime!: string;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @Column({ type: "varchar", default: "Casa" })
  responsible!: string;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: "CASCADE" })
  user!: User;
}
