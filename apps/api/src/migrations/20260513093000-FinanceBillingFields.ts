import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class FinanceBillingFields20260513093000 implements MigrationInterface {
  name = "FinanceBillingFields20260513093000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("finances", [
      new TableColumn({ name: "paymentKind", type: "varchar", length: "255", isNullable: true }),
      new TableColumn({ name: "paymentName", type: "varchar", length: "255", isNullable: true }),
      new TableColumn({ name: "dueDate", type: "date", isNullable: true }),
      new TableColumn({ name: "billingMonth", type: "varchar", length: "7", isNullable: true }),
      new TableColumn({ name: "notes", type: "varchar", length: "255", isNullable: true })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("finances", "notes");
    await queryRunner.dropColumn("finances", "billingMonth");
    await queryRunner.dropColumn("finances", "dueDate");
    await queryRunner.dropColumn("finances", "paymentName");
    await queryRunner.dropColumn("finances", "paymentKind");
  }
}
