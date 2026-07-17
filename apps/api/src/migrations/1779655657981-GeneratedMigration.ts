import type { MigrationInterface, QueryRunner } from "typeorm";

export class GeneratedMigration1779655657981 implements MigrationInterface {
    name = 'GeneratedMigration1779655657981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await ensureUniqueIndex(queryRunner, "google_calendar_event_syncs", ["agendaEventId", "connectionId"], "IDX_85726323be1e3aa5607d9f2f21");
        await ensureUniqueIndex(queryRunner, "google_calendar_connections", ["userId", "responsible"], "IDX_ceb86993213ba08ea55399c7b8");
        await ensureForeignKey(queryRunner, "google_calendar_event_syncs", "agendaEventId", "agenda_events", "id", "FK_c7d16892aed7e317b39929e5c05");
        await ensureForeignKey(queryRunner, "google_calendar_event_syncs", "connectionId", "google_calendar_connections", "id", "FK_564b8d0f6052e0d1ce6edad9ac8");
        await ensureForeignKey(queryRunner, "google_calendar_connections", "userId", "users", "id", "FK_20a15ff58f76fbfa3e626c852b5");
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

async function ensureUniqueIndex(queryRunner: QueryRunner, tableName: string, columns: string[], indexName: string) {
    if (!(await queryRunner.hasTable(tableName))) return;
    const indexes = (await queryRunner.query(
        `
        SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND NON_UNIQUE = 0
        GROUP BY INDEX_NAME
        `,
        [tableName]
    )) as Array<{ INDEX_NAME: string; columns: string }>;
    if (indexes.some((index) => index.columns === columns.join(","))) return;
    await queryRunner.query(`CREATE UNIQUE INDEX \`${indexName}\` ON \`${tableName}\` (${columns.map((column) => `\`${column}\``).join(", ")})`);
}

async function ensureForeignKey(queryRunner: QueryRunner, tableName: string, column: string, referencedTable: string, referencedColumn: string, constraintName: string) {
    if (!(await queryRunner.hasTable(tableName))) return;
    const constraints = (await queryRunner.query(
        `
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
          AND REFERENCED_TABLE_NAME = ?
          AND REFERENCED_COLUMN_NAME = ?
        `,
        [tableName, column, referencedTable, referencedColumn]
    )) as Array<{ CONSTRAINT_NAME: string }>;
    if (constraints.length > 0) return;
    await queryRunner.query(`ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${referencedTable}\`(\`${referencedColumn}\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
}
