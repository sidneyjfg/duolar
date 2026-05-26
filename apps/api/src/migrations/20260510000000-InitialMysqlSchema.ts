import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class InitialMysqlSchema20260510000000 implements MigrationInterface {
  name = "InitialMysqlSchema20260510000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          { name: "name", type: "varchar", length: "255", isNullable: false },
          { name: "email", type: "varchar", length: "255", isNullable: false, isUnique: true },
          { name: "password", type: "varchar", length: "255", isNullable: false },
          {
            name: "createdAt",
            type: "datetime",
            precision: 6,
            isNullable: false,
            default: "CURRENT_TIMESTAMP(6)"
          }
        ]
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: "tasks",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          { name: "title", type: "varchar", length: "255", isNullable: false },
          { name: "description", type: "text", isNullable: true },
          { name: "weight", type: "int", isNullable: false, default: 1 },
          { name: "mentalEffort", type: "int", isNullable: false, default: 1 },
          { name: "domesticImpact", type: "int", isNullable: false, default: 1 },
          { name: "priority", type: "varchar", length: "255", isNullable: false, default: "'medium'" },
          { name: "recurrence", type: "varchar", length: "255", isNullable: false, default: "'none'" },
          { name: "dueDate", type: "date", isNullable: true },
          { name: "completed", type: "tinyint", isNullable: false, default: 0 },
          { name: "responsible", type: "varchar", length: "255", isNullable: false, default: "'Casa'" },
          { name: "userId", type: "varchar", length: "36", isNullable: true }
        ],
        foreignKeys: [
          {
            columnNames: ["userId"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE"
          }
        ]
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: "shopping_items",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          { name: "name", type: "varchar", length: "255", isNullable: false },
          { name: "quantity", type: "varchar", length: "255", isNullable: false, default: "'1 un'" },
          { name: "category", type: "varchar", length: "255", isNullable: false, default: "'mercado'" },
          { name: "estimatedPrice", type: "decimal", precision: 12, scale: 2, isNullable: false, default: 0 },
          { name: "actualPrice", type: "decimal", precision: 12, scale: 2, isNullable: false, default: 0 },
          { name: "checked", type: "tinyint", isNullable: false, default: 0 },
          { name: "cartStatus", type: "varchar", length: "255", isNullable: false, default: "'pending'" },
          { name: "purchased", type: "tinyint", isNullable: false, default: 0 },
          { name: "notes", type: "text", isNullable: true },
          { name: "userId", type: "varchar", length: "36", isNullable: true }
        ],
        foreignKeys: [
          {
            columnNames: ["userId"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE"
          }
        ]
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: "purchase_sessions",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          { name: "total", type: "decimal", precision: 12, scale: 2, isNullable: false, default: 0 },
          { name: "estimatedTotal", type: "decimal", precision: 12, scale: 2, isNullable: false, default: 0 },
          { name: "difference", type: "decimal", precision: 12, scale: 2, isNullable: false, default: 0 },
          { name: "items", type: "json", isNullable: false },
          {
            name: "createdAt",
            type: "datetime",
            precision: 6,
            isNullable: false,
            default: "CURRENT_TIMESTAMP(6)"
          },
          { name: "userId", type: "varchar", length: "36", isNullable: true }
        ],
        foreignKeys: [
          {
            columnNames: ["userId"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE"
          }
        ]
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: "finances",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          { name: "title", type: "varchar", length: "255", isNullable: false },
          { name: "amount", type: "decimal", precision: 12, scale: 2, isNullable: false },
          { name: "type", type: "varchar", length: "255", isNullable: false },
          { name: "category", type: "varchar", length: "255", isNullable: false },
          { name: "date", type: "date", isNullable: false },
          { name: "userId", type: "varchar", length: "36", isNullable: true }
        ],
        foreignKeys: [
          {
            columnNames: ["userId"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE"
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("finances", true);
    await queryRunner.dropTable("purchase_sessions", true);
    await queryRunner.dropTable("shopping_items", true);
    await queryRunner.dropTable("tasks", true);
    await queryRunner.dropTable("users", true);
  }
}
