import type { MigrationInterface, QueryRunner } from "typeorm";

export class TaskAgendaTime20260717010000 implements MigrationInterface {
  name = "TaskAgendaTime20260717010000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn("tasks", "agendaTime"))) {
      await queryRunner.query("ALTER TABLE `tasks` ADD `agendaTime` varchar(255) NOT NULL DEFAULT '09:00'");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn("tasks", "agendaTime")) {
      await queryRunner.query("ALTER TABLE `tasks` DROP COLUMN `agendaTime`");
    }
  }
}
