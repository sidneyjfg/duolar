import type { MigrationInterface, QueryRunner } from "typeorm";

export class GeneratedMigration1779655657981 implements MigrationInterface {
    name = 'GeneratedMigration1779655657981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` DROP FOREIGN KEY \`FK_google_calendar_sync_connection\``);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` DROP FOREIGN KEY \`FK_google_calendar_sync_event\``);
        await queryRunner.query(`ALTER TABLE \`google_calendar_connections\` DROP FOREIGN KEY \`FK_google_calendar_connections_user\``);
        await queryRunner.query(`DROP INDEX \`IDX_google_calendar_sync_event_connection\` ON \`google_calendar_event_syncs\``);
        await queryRunner.query(`DROP INDEX \`IDX_google_calendar_connection_user_responsible\` ON \`google_calendar_connections\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_85726323be1e3aa5607d9f2f21\` ON \`google_calendar_event_syncs\` (\`agendaEventId\`, \`connectionId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_ceb86993213ba08ea55399c7b8\` ON \`google_calendar_connections\` (\`userId\`, \`responsible\`)`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` ADD CONSTRAINT \`FK_c7d16892aed7e317b39929e5c05\` FOREIGN KEY (\`agendaEventId\`) REFERENCES \`agenda_events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` ADD CONSTRAINT \`FK_564b8d0f6052e0d1ce6edad9ac8\` FOREIGN KEY (\`connectionId\`) REFERENCES \`google_calendar_connections\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_connections\` ADD CONSTRAINT \`FK_20a15ff58f76fbfa3e626c852b5\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`google_calendar_connections\` DROP FOREIGN KEY \`FK_20a15ff58f76fbfa3e626c852b5\``);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` DROP FOREIGN KEY \`FK_564b8d0f6052e0d1ce6edad9ac8\``);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` DROP FOREIGN KEY \`FK_c7d16892aed7e317b39929e5c05\``);
        await queryRunner.query(`DROP INDEX \`IDX_ceb86993213ba08ea55399c7b8\` ON \`google_calendar_connections\``);
        await queryRunner.query(`DROP INDEX \`IDX_85726323be1e3aa5607d9f2f21\` ON \`google_calendar_event_syncs\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_google_calendar_connection_user_responsible\` ON \`google_calendar_connections\` (\`userId\`, \`responsible\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_google_calendar_sync_event_connection\` ON \`google_calendar_event_syncs\` (\`agendaEventId\`, \`connectionId\`)`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_connections\` ADD CONSTRAINT \`FK_google_calendar_connections_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` ADD CONSTRAINT \`FK_google_calendar_sync_event\` FOREIGN KEY (\`agendaEventId\`) REFERENCES \`agenda_events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` ADD CONSTRAINT \`FK_google_calendar_sync_connection\` FOREIGN KEY (\`connectionId\`) REFERENCES \`google_calendar_connections\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
