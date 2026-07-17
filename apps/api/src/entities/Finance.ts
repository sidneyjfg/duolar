import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

export type FinanceType = "income" | "expense";
export type FinanceCategory = "alimentacao" | "contas" | "lazer" | "transporte" | "saude" | "casa";
export type FinancePaymentKind = "cartao" | "conta_fixa" | "dinheiro" | "pix" | "debito" | "outros";
export type FinanceSharing = "personal" | "shared";

@Entity("finances")
export class Finance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: "varchar" })
  type!: FinanceType;

  @Column({ type: "varchar" })
  category!: FinanceCategory;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "varchar", nullable: true })
  paymentKind?: FinancePaymentKind;

  @Column({ type: "varchar", nullable: true })
  paymentName?: string;

  @Column({ type: "date", nullable: true })
  dueDate?: string;

  @Column({ type: "varchar", length: 7, nullable: true })
  billingMonth?: string;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  responsible?: string;

  @Column({ type: "varchar", default: "shared" })
  sharing!: FinanceSharing;

  @ManyToOne(() => User, (user) => user.finances, { onDelete: "CASCADE" })
  user!: User;
}
