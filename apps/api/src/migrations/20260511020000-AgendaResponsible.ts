import type { MigrationInterface, QueryRunner } from "typeorm";

export class AgendaResponsible20260511020000 implements MigrationInterface {
  name = "AgendaResponsible20260511020000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `agenda_events` ADD `responsible` varchar(255) NOT NULL DEFAULT 'Casa'");
    await queryRunner.query("UPDATE `agenda_events` SET `responsible` = COALESCE(NULLIF(`location`, ''), 'Casa') WHERE `category` = 'tarefa'");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `agenda_events` DROP COLUMN `responsible`");
  }
}
