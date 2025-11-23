import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateSessions1735689604000 implements MigrationInterface {
  name = "CreateSessions1735689604000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: "sessions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "userId",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "refreshToken",
            type: "text",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "expiresAt",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      "sessions",
      new TableIndex({
        name: "IDX_sessions_userId",
        columnNames: ["userId"],
      })
    );

    await queryRunner.createIndex(
      "sessions",
      new TableIndex({
        name: "IDX_sessions_expires_at",
        columnNames: ["expiresAt"],
      })
    );

    await queryRunner.createIndex(
      "sessions",
      new TableIndex({
        name: "IDX_sessions_refreshToken",
        columnNames: ["refreshToken"],
      })
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      "sessions",
      new TableForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable("sessions");
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("sessions", fk);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex("sessions", "IDX_sessions_refreshToken");
    await queryRunner.dropIndex("sessions", "IDX_sessions_expires_at");
    await queryRunner.dropIndex("sessions", "IDX_sessions_userId");

    await queryRunner.dropTable("sessions");
  }
}
