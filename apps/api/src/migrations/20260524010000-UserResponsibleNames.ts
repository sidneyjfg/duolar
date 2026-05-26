import { MigrationInterface, QueryRunner } from "typeorm";

export class UserResponsibleNames20260524010000 implements MigrationInterface {
  name = "UserResponsibleNames20260524010000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `users` ADD `responsibleNames` json NULL");
    await queryRunner.query("UPDATE `users` SET `responsibleNames` = JSON_ARRAY(`name`) WHERE `responsibleNames` IS NULL");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `responsibleNames`");
  }
}
