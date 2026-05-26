import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { AgendaEvent } from "./AgendaEvent";
import { GoogleCalendarConnection } from "./GoogleCalendarConnection";

@Entity("google_calendar_event_syncs")
@Index(["agendaEvent", "connection"], { unique: true })
export class GoogleCalendarEventSync {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  googleEventId!: string;

  @Column({ type: "varchar", default: "synced" })
  status!: "synced" | "failed";

  @Column({ type: "text", nullable: true })
  lastError?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => AgendaEvent, { onDelete: "CASCADE" })
  agendaEvent!: AgendaEvent;

  @ManyToOne(() => GoogleCalendarConnection, (connection) => connection.eventSyncs, { onDelete: "CASCADE" })
  connection!: GoogleCalendarConnection;
}
