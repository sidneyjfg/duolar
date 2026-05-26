import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

export type AgendaEventCategory = "faculdade" | "trabalho" | "refeicao" | "familia" | "lazer" | "transporte" | "tarefa" | "outros";

@Entity("agenda_events")
export class AgendaEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar", default: "outros" })
  category!: AgendaEventCategory;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "varchar", length: "5" })
  startTime!: string;

  @Column({ type: "varchar", length: "5", nullable: true })
  endTime?: string;

  @Column({ type: "varchar", default: "Casa" })
  responsible!: string;

  @Column({ type: "varchar", nullable: true })
  location?: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @ManyToOne(() => User, (user) => user.agendaEvents, { onDelete: "CASCADE" })
  user!: User;
}
