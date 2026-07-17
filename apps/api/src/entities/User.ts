import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Finance } from "./Finance";
import { PurchaseSession } from "./PurchaseSession";
import { ShoppingItem } from "./ShoppingItem";
import { Task } from "./Task";
import { AgendaEvent } from "./AgendaEvent";
import { PersonalRule } from "./PersonalRule";
import { GoogleCalendarConnection } from "./GoogleCalendarConnection";
import { Session } from "./Session";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar" })
  password!: string;

  @Column({ type: "json", nullable: true })
  responsibleNames?: string[];

  @Column({ type: "datetime", nullable: true })
  disabledAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Task, (task) => task.user)
  tasks!: Task[];

  @OneToMany(() => ShoppingItem, (item) => item.user)
  shoppingItems!: ShoppingItem[];

  @OneToMany(() => PurchaseSession, (session) => session.user)
  purchaseSessions!: PurchaseSession[];

  @OneToMany(() => Finance, (finance) => finance.user)
  finances!: Finance[];

  @OneToMany(() => AgendaEvent, (event) => event.user)
  agendaEvents!: AgendaEvent[];

  @OneToMany(() => PersonalRule, (rule) => rule.user)
  personalRules!: PersonalRule[];

  @OneToMany(() => GoogleCalendarConnection, (connection) => connection.user)
  googleCalendarConnections!: GoogleCalendarConnection[];

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];
}
