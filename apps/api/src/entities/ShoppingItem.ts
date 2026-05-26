import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

export type ShoppingCategory = "mercado" | "limpeza" | "farmacia" | "pet" | "outros";
export type CartStatus = "pending" | "cart" | "purchased";

@Entity("shopping_items")
export class ShoppingItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", default: "1 un" })
  quantity!: string;

  @Column({ type: "varchar", default: "mercado" })
  category!: ShoppingCategory;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  estimatedPrice!: number;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  actualPrice!: number;

  @Column({ type: "boolean", default: false })
  checked!: boolean;

  @Column({ type: "varchar", default: "pending" })
  cartStatus!: CartStatus;

  @Column({ type: "boolean", default: false })
  purchased!: boolean;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @ManyToOne(() => User, (user) => user.shoppingItems, { onDelete: "CASCADE" })
  user!: User;
}
