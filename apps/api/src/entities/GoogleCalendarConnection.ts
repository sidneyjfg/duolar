import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";
import { GoogleCalendarEventSync } from "./GoogleCalendarEventSync";

@Entity("google_calendar_connections")
@Index(["user", "responsible"], { unique: true })
export class GoogleCalendarConnection {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  responsible!: string;

  @Column({ type: "varchar" })
  googleEmail!: string;

  @Column({ type: "varchar", default: "primary" })
  calendarId!: string;

  @Column({ type: "text" })
  accessToken!: string;

  @Column({ type: "text" })
  refreshToken!: string;

  @Column({ type: "datetime", nullable: true })
  tokenExpiryDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.googleCalendarConnections, { onDelete: "CASCADE" })
  user!: User;

  @OneToMany(() => GoogleCalendarEventSync, (sync) => sync.connection)
  eventSyncs!: GoogleCalendarEventSync[];
}
