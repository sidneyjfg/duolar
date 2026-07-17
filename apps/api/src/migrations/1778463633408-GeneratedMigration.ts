import type { MigrationInterface, QueryRunner } from "typeorm";

export class GeneratedMigration1778463633408 implements MigrationInterface {
    name = 'GeneratedMigration1778463633408'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await ensureUniqueEmailIndex(queryRunner);
        await ensureUserForeignKey(queryRunner, "purchase_sessions", "FK_79f8c1b37108f226ae8cdc61ce4");
        await ensureUserForeignKey(queryRunner, "shopping_items", "FK_0efd2fcdae6a7f951173723a631");
        await ensureUserForeignKey(queryRunner, "tasks", "FK_166bd96559cb38595d392f75a35");
        await ensureUserForeignKey(queryRunner, "finances", "FK_29d58d04e6b88654ede43247667");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`finances\` DROP FOREIGN KEY \`FK_29d58d04e6b88654ede43247667\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_166bd96559cb38595d392f75a35\``);
        await queryRunner.query(`ALTER TABLE \`shopping_items\` DROP FOREIGN KEY \`FK_0efd2fcdae6a7f951173723a631\``);
        await queryRunner.query(`ALTER TABLE \`purchase_sessions\` DROP FOREIGN KEY \`FK_79f8c1b37108f226ae8cdc61ce4\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`UQ_97672ac88f789774dd47f7c8be3\` ON \`users\` (\`email\`)`);
        await queryRunner.query(`ALTER TABLE \`finances\` ADD CONSTRAINT \`FK_29d58d04e6b88654ede43247667\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_166bd96559cb38595d392f75a35\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`shopping_items\` ADD CONSTRAINT \`FK_0efd2fcdae6a7f951173723a631\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
        await queryRunner.query(`ALTER TABLE \`purchase_sessions\` ADD CONSTRAINT \`FK_79f8c1b37108f226ae8cdc61ce4\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT`);
    }

}

async function tableExists(queryRunner: QueryRunner, tableName: string) {
    return queryRunner.hasTable(tableName);
}

async function ensureUniqueEmailIndex(queryRunner: QueryRunner) {
    if (!(await tableExists(queryRunner, "users"))) return;
    const indexes = (await queryRunner.query(`
        SELECT INDEX_NAME
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'email'
          AND NON_UNIQUE = 0
    `)) as Array<{ INDEX_NAME: string }>;
    if (indexes.length > 0) return;
    await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`)`);
}

async function ensureUserForeignKey(queryRunner: QueryRunner, tableName: string, constraintName: string) {
    if (!(await tableExists(queryRunner, tableName))) return;
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
