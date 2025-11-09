import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateFriendRequests1700000006 implements MigrationInterface {
  name = "CreateFriendRequests1700000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum type for status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'declined');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create friend_requests table
    await queryRunner.createTable(
      new Table({
        name: "friend_requests",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: "fromUserId",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "toUserId",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "status",
            type: "friend_request_status",
            default: "'pending'",
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
            onUpdate: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create unique constraint on fromUserId and toUserId
    await queryRunner.createIndex(
      "friend_requests",
      new TableIndex({
        name: "IDX_friend_requests_user_friend",
        columnNames: ["fromUserId", "toUserId"],
        isUnique: true,
      })
    );

    // Create index on status
    await queryRunner.createIndex(
      "friend_requests",
      new TableIndex({
        name: "IDX_friend_requests_status",
        columnNames: ["status"],
      })
    );

    // Create foreign key constraints
    await queryRunner.createForeignKey(
      "friend_requests",
      new TableForeignKey({
        columnNames: ["fromUserId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "friend_requests",
      new TableForeignKey({
        columnNames: ["toUserId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable("friend_requests");
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("friend_requests", fk);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex("friend_requests", "IDX_friend_requests_status");
    await queryRunner.dropIndex("friend_requests", "IDX_friend_requests_user_friend");

    // Drop table
    await queryRunner.dropTable("friend_requests");

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS friend_request_status`);
  }
}

