import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

export type PersonalRuleCategory = "alimentacao" | "consumo" | "estudo" | "saude" | "rotina" | "financeiro" | "outros";
export type PersonalRuleStatus = "active" | "paused" | "completed";

@Entity("personal_rules")
export class PersonalRule {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar", default: "rotina" })
  category!: PersonalRuleCategory;

  @Column({ type: "text" })
  conditionText!: string;

  @Column({ type: "text" })
  rewardText!: string;

  @Column({ type: "text", nullable: true })
  consequenceText?: string;

  @Column({ type: "varchar", default: "active" })
  status!: PersonalRuleStatus;

  @Column({ type: "json", nullable: true })
  completedDates?: string[];

  @ManyToOne(() => User, (user) => user.personalRules, { onDelete: "CASCADE" })
  user!: User;
}
