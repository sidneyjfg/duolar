import { MigrationInterface, QueryRunner } from "typeorm";

export class GeneratedMigration1778469305707 implements MigrationInterface {
    name = 'GeneratedMigration1778469305707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`agenda_events\` DROP FOREIGN KEY \`FK_agenda_events_user\``);
        await queryRunner.query(`ALTER TABLE \`personal_rules\` DROP FOREIGN KEY \`FK_personal_rules_user\``);
        await queryRunner.query(`ALTER TABLE \`agenda_events\` ADD CONSTRAINT \`FK_8aa7fa3e219ed566e8c50890310\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`personal_rules\` ADD CONSTRAINT \`FK_7e58e9d7976cc000356319c4193\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`personal_rules\` DROP FOREIGN KEY \`FK_7e58e9d7976cc000356319c4193\``);
        await queryRunner.query(`ALTER TABLE \`agenda_events\` DROP FOREIGN KEY \`FK_8aa7fa3e219ed566e8c50890310\``);
        await queryRunner.query(`ALTER TABLE \`personal_rules\` ADD CONSTRAINT \`FK_personal_rules_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`agenda_events\` ADD CONSTRAINT \`FK_agenda_events_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
