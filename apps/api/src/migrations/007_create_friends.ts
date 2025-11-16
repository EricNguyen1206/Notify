import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateFriends1735689606000 implements MigrationInterface {
  name = "CreateFriends1735689606000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create friends table
    await queryRunner.createTable(
      new Table({
        name: "friends",
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
            name: "friendId",
            type: "uuid",
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

    // Create unique constraint on userId and friendId
    await queryRunner.createIndex(
      "friends",
      new TableIndex({
        name: "IDX_friends_user_friend",
        columnNames: ["userId", "friendId"],
        isUnique: true,
      })
    );

    // Create foreign key constraints
    await queryRunner.createForeignKey(
      "friends",
      new TableForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "friends",
      new TableForeignKey({
        columnNames: ["friendId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable("friends");
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("friends", fk);
      }
    }

    // Drop indexes
    await queryRunner.dropIndex("friends", "IDX_friends_user_friend");

    // Drop table
    await queryRunner.dropTable("friends");
  }
}

