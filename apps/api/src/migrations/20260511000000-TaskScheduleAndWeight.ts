import type { MigrationInterface, QueryRunner } from "typeorm";

export class TaskScheduleAndWeight20260511000000 implements MigrationInterface {
  name = "TaskScheduleAndWeight20260511000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `tasks` ADD `scheduledDays` json NULL");
    await queryRunner.query("ALTER TABLE `tasks` ADD `completedDates` json NULL");
    await queryRunner.query(`
      UPDATE \`tasks\`
      SET \`weight\` = CASE
        WHEN CAST(\`weight\` AS UNSIGNED) >= 7 THEN 'pesado'
        WHEN CAST(\`weight\` AS UNSIGNED) >= 4 THEN 'medio'
        ELSE 'simples'
      END
    `);
    await queryRunner.query("ALTER TABLE `tasks` MODIFY `weight` varchar(255) NOT NULL DEFAULT 'simples'");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`tasks\`
      SET \`weight\` = CASE
        WHEN \`weight\` = 'pesado' THEN '8'
        WHEN \`weight\` = 'medio' THEN '5'
        ELSE '2'
      END
    `);
    await queryRunner.query("ALTER TABLE `tasks` MODIFY `weight` int NOT NULL DEFAULT 1");
    await queryRunner.query("ALTER TABLE `tasks` DROP COLUMN `completedDates`");
    await queryRunner.query("ALTER TABLE `tasks` DROP COLUMN `scheduledDays`");
  }
}
