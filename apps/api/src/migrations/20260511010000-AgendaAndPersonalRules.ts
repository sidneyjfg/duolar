import { MigrationInterface, QueryRunner } from "typeorm";

export class AgendaAndPersonalRules20260511010000 implements MigrationInterface {
  name = "AgendaAndPersonalRules20260511010000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`agenda_events\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`category\` varchar(255) NOT NULL DEFAULT 'outros',
        \`date\` date NOT NULL,
        \`startTime\` varchar(5) NOT NULL,
        \`endTime\` varchar(5) NULL,
        \`location\` varchar(255) NULL,
        \`notes\` text NULL,
        \`completed\` tinyint NOT NULL DEFAULT 0,
        \`userId\` varchar(36) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`personal_rules\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`category\` varchar(255) NOT NULL DEFAULT 'rotina',
        \`conditionText\` text NOT NULL,
        \`rewardText\` text NOT NULL,
        \`consequenceText\` text NULL,
        \`status\` varchar(255) NOT NULL DEFAULT 'active',
        \`completedDates\` json NULL,
        \`userId\` varchar(36) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query("ALTER TABLE `agenda_events` ADD CONSTRAINT `FK_agenda_events_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    await queryRunner.query("ALTER TABLE `personal_rules` ADD CONSTRAINT `FK_personal_rules_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `personal_rules` DROP FOREIGN KEY `FK_personal_rules_user`");
    await queryRunner.query("ALTER TABLE `agenda_events` DROP FOREIGN KEY `FK_agenda_events_user`");
    await queryRunner.query("DROP TABLE `personal_rules`");
    await queryRunner.query("DROP TABLE `agenda_events`");
  }
}
