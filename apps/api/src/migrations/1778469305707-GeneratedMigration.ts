import type { MigrationInterface, QueryRunner } from "typeorm";

export class GeneratedMigration1778469305707 implements MigrationInterface {
    name = 'GeneratedMigration1778469305707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await ensureUserForeignKey(queryRunner, "agenda_events", "FK_8aa7fa3e219ed566e8c50890310");
        await ensureUserForeignKey(queryRunner, "personal_rules", "FK_7e58e9d7976cc000356319c4193");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`personal_rules\` DROP FOREIGN KEY \`FK_7e58e9d7976cc000356319c4193\``);
        await queryRunner.query(`ALTER TABLE \`agenda_events\` DROP FOREIGN KEY \`FK_8aa7fa3e219ed566e8c50890310\``);
        await queryRunner.query(`ALTER TABLE \`personal_rules\` ADD CONSTRAINT \`FK_personal_rules_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`agenda_events\` ADD CONSTRAINT \`FK_agenda_events_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

async function ensureUserForeignKey(queryRunner: QueryRunner, tableName: string, constraintName: string) {
    if (!(await queryRunner.hasTable(tableName))) return;
    const constraints = (await queryRunner.query(
        `
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = 'userId'
          AND REFERENCED_TABLE_NAME = 'users'
          AND REFERENCED_COLUMN_NAME = 'id'
        `,
        [tableName]
    )) as Array<{ CONSTRAINT_NAME: string }>;
    if (constraints.length > 0) return;
    await queryRunner.query(`ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
}
