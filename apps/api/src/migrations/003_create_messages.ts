import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateMessages1735689602000 implements MigrationInterface {
  name = "CreateMessages1735689602000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: "messages",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "senderId",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "receiverId",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "conversationId",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "text",
            type: "text",
            isNullable: true,
          },
          {
            name: "url",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "fileName",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
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

    // Create indexes for better query performance
    await queryRunner.createIndex(
      "messages",
      new TableIndex({
        name: "IDX_messages_senderId",
        columnNames: ["senderId"],
      })
    );

    await queryRunner.createIndex(
      "messages",
      new TableIndex({
        name: "IDX_messages_receiverId",
        columnNames: ["receiverId"],
      })
    );

    await queryRunner.createIndex(
      "messages",
      new TableIndex({
        name: "IDX_messages_conversationId",
        columnNames: ["conversationId"],
      })
    );

    await queryRunner.createIndex(
      "messages",
      new TableIndex({
        name: "IDX_messages_createdAt",
        columnNames: ["createdAt"],
      })
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      "messages",
      new TableForeignKey({
        columnNames: ["senderId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "messages",
      new TableForeignKey({
        columnNames: ["conversationId"],
        referencedColumnNames: ["id"],
        referencedTableName: "conversations",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "messages",
      new TableForeignKey({
        columnNames: ["receiverId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable("messages");
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("messages", fk);
      }
    }

    await queryRunner.dropTable("messages");
  }
}
