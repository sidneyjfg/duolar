import { MigrationInterface, QueryRunner } from "typeorm";

export class GeneratedMigration1784300284020 implements MigrationInterface {
    name = 'GeneratedMigration1784300284020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`purchase_sessions\` DROP FOREIGN KEY \`FK_79f8c1b37108f226ae8cdc61ce4\``);
        await queryRunner.query(`ALTER TABLE \`shopping_items\` DROP FOREIGN KEY \`FK_0efd2fcdae6a7f951173723a631\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_166bd96559cb38595d392f75a35\``);
        await queryRunner.query(`ALTER TABLE \`agenda_events\` DROP FOREIGN KEY \`FK_agenda_events_user\``);
        await queryRunner.query(`ALTER TABLE \`personal_rules\` DROP FOREIGN KEY \`FK_personal_rules_user\``);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` DROP FOREIGN KEY \`FK_google_calendar_sync_connection\``);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` DROP FOREIGN KEY \`FK_google_calendar_sync_event\``);
        await queryRunner.query(`ALTER TABLE \`google_calendar_connections\` DROP FOREIGN KEY \`FK_google_calendar_connections_user\``);
        await queryRunner.query(`ALTER TABLE \`sessions\` DROP FOREIGN KEY \`FK_sessions_user\``);
        await queryRunner.query(`ALTER TABLE \`finances\` DROP FOREIGN KEY \`FK_29d58d04e6b88654ede43247667\``);
        await queryRunner.query(`ALTER TABLE \`invites\` DROP FOREIGN KEY \`FK_invites_used_by\``);
        await queryRunner.query(`DROP INDEX \`IDX_google_calendar_sync_event_connection\` ON \`google_calendar_event_syncs\``);
        await queryRunner.query(`DROP INDEX \`IDX_google_calendar_connection_user_responsible\` ON \`google_calendar_connections\``);
        await queryRunner.query(`DROP INDEX \`IDX_sessions_token_hash\` ON \`sessions\``);
        await queryRunner.query(`DROP INDEX \`UQ_97672ac88f789774dd47f7c8be3\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_invites_token_hash\` ON \`invites\``);
        await queryRunner.query(`ALTER TABLE \`sessions\` ADD UNIQUE INDEX \`IDX_bace6c68efc156fddac9b14bda\` (\`tokenHash\`)`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`)`);
        await queryRunner.query(`ALTER TABLE \`invites\` ADD UNIQUE INDEX \`IDX_521aa0cf9f7e7ded862840ffa5\` (\`tokenHash\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_85726323be1e3aa5607d9f2f21\` ON \`google_calendar_event_syncs\` (\`agendaEventId\`, \`connectionId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_ceb86993213ba08ea55399c7b8\` ON \`google_calendar_connections\` (\`userId\`, \`responsible\`)`);
        await queryRunner.query(`ALTER TABLE \`purchase_sessions\` ADD CONSTRAINT \`FK_79f8c1b37108f226ae8cdc61ce4\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shopping_items\` ADD CONSTRAINT \`FK_0efd2fcdae6a7f951173723a631\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_166bd96559cb38595d392f75a35\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`agenda_events\` ADD CONSTRAINT \`FK_8aa7fa3e219ed566e8c50890310\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`personal_rules\` ADD CONSTRAINT \`FK_7e58e9d7976cc000356319c4193\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` ADD CONSTRAINT \`FK_c7d16892aed7e317b39929e5c05\` FOREIGN KEY (\`agendaEventId\`) REFERENCES \`agenda_events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` ADD CONSTRAINT \`FK_564b8d0f6052e0d1ce6edad9ac8\` FOREIGN KEY (\`connectionId\`) REFERENCES \`google_calendar_connections\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_connections\` ADD CONSTRAINT \`FK_20a15ff58f76fbfa3e626c852b5\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sessions\` ADD CONSTRAINT \`FK_57de40bc620f456c7311aa3a1e6\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`finances\` ADD CONSTRAINT \`FK_29d58d04e6b88654ede43247667\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invites\` ADD CONSTRAINT \`FK_247c25f193a45f17bd403eb7379\` FOREIGN KEY (\`usedById\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`invites\` DROP FOREIGN KEY \`FK_247c25f193a45f17bd403eb7379\``);
        await queryRunner.query(`ALTER TABLE \`finances\` DROP FOREIGN KEY \`FK_29d58d04e6b88654ede43247667\``);
        await queryRunner.query(`ALTER TABLE \`sessions\` DROP FOREIGN KEY \`FK_57de40bc620f456c7311aa3a1e6\``);
        await queryRunner.query(`ALTER TABLE \`google_calendar_connections\` DROP FOREIGN KEY \`FK_20a15ff58f76fbfa3e626c852b5\``);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` DROP FOREIGN KEY \`FK_564b8d0f6052e0d1ce6edad9ac8\``);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` DROP FOREIGN KEY \`FK_c7d16892aed7e317b39929e5c05\``);
        await queryRunner.query(`ALTER TABLE \`personal_rules\` DROP FOREIGN KEY \`FK_7e58e9d7976cc000356319c4193\``);
        await queryRunner.query(`ALTER TABLE \`agenda_events\` DROP FOREIGN KEY \`FK_8aa7fa3e219ed566e8c50890310\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_166bd96559cb38595d392f75a35\``);
        await queryRunner.query(`ALTER TABLE \`shopping_items\` DROP FOREIGN KEY \`FK_0efd2fcdae6a7f951173723a631\``);
        await queryRunner.query(`ALTER TABLE \`purchase_sessions\` DROP FOREIGN KEY \`FK_79f8c1b37108f226ae8cdc61ce4\``);
        await queryRunner.query(`DROP INDEX \`IDX_ceb86993213ba08ea55399c7b8\` ON \`google_calendar_connections\``);
        await queryRunner.query(`DROP INDEX \`IDX_85726323be1e3aa5607d9f2f21\` ON \`google_calendar_event_syncs\``);
        await queryRunner.query(`ALTER TABLE \`invites\` DROP INDEX \`IDX_521aa0cf9f7e7ded862840ffa5\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\``);
        await queryRunner.query(`ALTER TABLE \`sessions\` DROP INDEX \`IDX_bace6c68efc156fddac9b14bda\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_invites_token_hash\` ON \`invites\` (\`tokenHash\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`UQ_97672ac88f789774dd47f7c8be3\` ON \`users\` (\`email\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_sessions_token_hash\` ON \`sessions\` (\`tokenHash\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_google_calendar_connection_user_responsible\` ON \`google_calendar_connections\` (\`userId\`, \`responsible\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_google_calendar_sync_event_connection\` ON \`google_calendar_event_syncs\` (\`agendaEventId\`, \`connectionId\`)`);
        await queryRunner.query(`ALTER TABLE \`invites\` ADD CONSTRAINT \`FK_invites_used_by\` FOREIGN KEY (\`usedById\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`finances\` ADD CONSTRAINT \`FK_29d58d04e6b88654ede43247667\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`sessions\` ADD CONSTRAINT \`FK_sessions_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_connections\` ADD CONSTRAINT \`FK_google_calendar_connections_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` ADD CONSTRAINT \`FK_google_calendar_sync_event\` FOREIGN KEY (\`agendaEventId\`) REFERENCES \`agenda_events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`google_calendar_event_syncs\` ADD CONSTRAINT \`FK_google_calendar_sync_connection\` FOREIGN KEY (\`connectionId\`) REFERENCES \`google_calendar_connections\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`personal_rules\` ADD CONSTRAINT \`FK_personal_rules_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`agenda_events\` ADD CONSTRAINT \`FK_agenda_events_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_166bd96559cb38595d392f75a35\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`shopping_items\` ADD CONSTRAINT \`FK_0efd2fcdae6a7f951173723a631\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`purchase_sessions\` ADD CONSTRAINT \`FK_79f8c1b37108f226ae8cdc61ce4\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
    }

}
