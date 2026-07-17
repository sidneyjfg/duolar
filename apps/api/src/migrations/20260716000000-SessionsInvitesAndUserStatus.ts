import { MigrationInterface, QueryRunner } from "typeorm";

export class SessionsInvitesAndUserStatus20260716000000 implements MigrationInterface {
  name = "SessionsInvitesAndUserStatus20260716000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `users` ADD `disabledAt` datetime NULL");
    await queryRunner.query(`
      CREATE TABLE \`sessions\` (
        \`id\` varchar(36) NOT NULL,
        \`tokenHash\` char(64) NOT NULL,
        \`csrfTokenHash\` char(64) NOT NULL,
        \`expiresAt\` datetime NOT NULL,
        \`revokedAt\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`userId\` varchar(36) NULL,
        UNIQUE INDEX \`IDX_sessions_token_hash\` (\`tokenHash\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`invites\` (
        \`id\` varchar(36) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`tokenHash\` char(64) NOT NULL,
        \`usedAt\` datetime NULL,
        \`revokedAt\` datetime NULL,
        \`expiresAt\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`usedById\` varchar(36) NULL,
        UNIQUE INDEX \`IDX_invites_token_hash\` (\`tokenHash\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query("ALTER TABLE `sessions` ADD CONSTRAINT `FK_sessions_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    await queryRunner.query("ALTER TABLE `invites` ADD CONSTRAINT `FK_invites_used_by` FOREIGN KEY (`usedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `invites` DROP FOREIGN KEY `FK_invites_used_by`");
    await queryRunner.query("ALTER TABLE `sessions` DROP FOREIGN KEY `FK_sessions_user`");
    await queryRunner.query("DROP TABLE `invites`");
    await queryRunner.query("DROP TABLE `sessions`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `disabledAt`");
  }
}
