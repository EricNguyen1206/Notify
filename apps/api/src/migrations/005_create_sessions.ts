import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from "typeorm";

export class CreateSessions1700000005 implements MigrationInterface {
  name = "CreateSessions1700000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "sessions",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "userId",
            type: "int",
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
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
          {
            name: "deletedAt",
            type: "timestamp",
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      "sessions",
      new ForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    // Create indexes
    await queryRunner.createIndex("sessions", new Index("IDX_sessions_user_id", ["userId"]));
    await queryRunner.createIndex("sessions", new Index("IDX_sessions_refresh_token", ["refreshToken"]));
    await queryRunner.createIndex("sessions", new Index("IDX_sessions_expires_at", ["expiresAt"]));
    await queryRunner.createIndex("sessions", new Index("IDX_sessions_deleted_at", ["deletedAt"]));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("sessions");
  }
}

