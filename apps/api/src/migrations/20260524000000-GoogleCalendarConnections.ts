import type { MigrationInterface, QueryRunner } from "typeorm";

export class GoogleCalendarConnections20260524000000 implements MigrationInterface {
  name = "GoogleCalendarConnections20260524000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`google_calendar_connections\` (
        \`id\` varchar(36) NOT NULL,
        \`responsible\` varchar(255) NOT NULL,
        \`googleEmail\` varchar(255) NOT NULL,
        \`calendarId\` varchar(255) NOT NULL DEFAULT 'primary',
        \`accessToken\` text NOT NULL,
        \`refreshToken\` text NOT NULL,
        \`tokenExpiryDate\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`userId\` varchar(36) NULL,
        UNIQUE INDEX \`IDX_google_calendar_connection_user_responsible\` (\`userId\`, \`responsible\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`google_calendar_event_syncs\` (
        \`id\` varchar(36) NOT NULL,
        \`googleEventId\` varchar(255) NOT NULL,
        \`status\` varchar(255) NOT NULL DEFAULT 'synced',
        \`lastError\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`agendaEventId\` varchar(36) NULL,
        \`connectionId\` varchar(36) NULL,
        UNIQUE INDEX \`IDX_google_calendar_sync_event_connection\` (\`agendaEventId\`, \`connectionId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query("ALTER TABLE `google_calendar_connections` ADD CONSTRAINT `FK_google_calendar_connections_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    await queryRunner.query("ALTER TABLE `google_calendar_event_syncs` ADD CONSTRAINT `FK_google_calendar_sync_event` FOREIGN KEY (`agendaEventId`) REFERENCES `agenda_events`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    await queryRunner.query("ALTER TABLE `google_calendar_event_syncs` ADD CONSTRAINT `FK_google_calendar_sync_connection` FOREIGN KEY (`connectionId`) REFERENCES `google_calendar_connections`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `google_calendar_event_syncs` DROP FOREIGN KEY `FK_google_calendar_sync_connection`");
    await queryRunner.query("ALTER TABLE `google_calendar_event_syncs` DROP FOREIGN KEY `FK_google_calendar_sync_event`");
    await queryRunner.query("ALTER TABLE `google_calendar_connections` DROP FOREIGN KEY `FK_google_calendar_connections_user`");
    await queryRunner.query("DROP TABLE `google_calendar_event_syncs`");
    await queryRunner.query("DROP TABLE `google_calendar_connections`");
  }
}
