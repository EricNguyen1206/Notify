import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateParticipants1735689603000 implements MigrationInterface {
  name = "CreateParticipants1735689603000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: "participants",
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
            name: "conversationId",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "joinedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create unique constraint on userId and conversationId
    await queryRunner.createIndex(
      "participants",
      new TableIndex({
        name: "IDX_participants_user_conversation",
        columnNames: ["userId", "conversationId"],
        isUnique: true,
      })
    );

    // Create additional indexes for better query performance
    await queryRunner.createIndex(
      "participants",
      new TableIndex({
        name: "IDX_participants_userId",
        columnNames: ["userId"],
      })
    );

    await queryRunner.createIndex(
      "participants",
      new TableIndex({
        name: "IDX_participants_conversationId",
        columnNames: ["conversationId"],
      })
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      "participants",
      new TableForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "participants",
      new TableForeignKey({
        columnNames: ["conversationId"],
        referencedColumnNames: ["id"],
        referencedTableName: "conversations",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable("participants");
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("participants", fk);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex("participants", "IDX_participants_conversationId");
    await queryRunner.dropIndex("participants", "IDX_participants_userId");
    await queryRunner.dropIndex("participants", "IDX_participants_user_conversation");

    await queryRunner.dropTable("participants");
  }
}
