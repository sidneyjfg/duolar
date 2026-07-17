import { TableColumn } from "typeorm";
import type { MigrationInterface, QueryRunner } from "typeorm";

export class FinanceParticipantsAndSharing20260717130000 implements MigrationInterface {
  name = "FinanceParticipantsAndSharing20260717130000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("finances", [
      new TableColumn({ name: "responsible", type: "varchar", length: "120", isNullable: true }),
      new TableColumn({ name: "sharing", type: "varchar", length: "255", default: "'shared'", isNullable: false })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("finances", "sharing");
    await queryRunner.dropColumn("finances", "responsible");
  }
}
