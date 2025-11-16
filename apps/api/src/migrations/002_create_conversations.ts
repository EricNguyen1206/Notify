import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateConversations1735689601000 implements MigrationInterface {
  name = "CreateConversations1735689601000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum type for conversation type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE conversation_type AS ENUM ('direct', 'group');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: "conversations",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "ownerId",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "type",
            type: "conversation_type",
            default: "'group'",
            isNullable: false,
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

    // Create indexes
    await queryRunner.createIndex(
      "conversations",
      new TableIndex({
        name: "IDX_conversations_ownerId",
        columnNames: ["ownerId"],
      })
    );

    await queryRunner.createIndex(
      "conversations",
      new TableIndex({
        name: "IDX_conversations_type",
        columnNames: ["type"],
      })
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      "conversations",
      new TableForeignKey({
        columnNames: ["ownerId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable("conversations");
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("conversations", fk);
      }
    }

    await queryRunner.dropTable("conversations");
    await queryRunner.query(`DROP TYPE IF EXISTS conversation_type`);
  }
}
