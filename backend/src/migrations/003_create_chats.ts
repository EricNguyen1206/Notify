import { MigrationInterface, QueryRunner, Table, Index, ForeignKey, Check } from "typeorm";

export class CreateChats1700000003 implements MigrationInterface {
  name = "CreateChats1700000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "chats",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "senderId",
            type: "int",
            isNullable: false,
          },
          {
            name: "receiverId",
            type: "int",
            isNullable: true,
          },
          {
            name: "channelId",
            type: "int",
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

    // Create foreign key constraints
    await queryRunner.createForeignKey(
      "chats",
      new ForeignKey({
        columnNames: ["senderId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "chats",
      new ForeignKey({
        columnNames: ["receiverId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "chats",
      new ForeignKey({
        columnNames: ["channelId"],
        referencedColumnNames: ["id"],
        referencedTableName: "channels",
        onDelete: "CASCADE",
      })
    );

    // Create check constraint to ensure exactly one of receiverId or channelId is set
    await queryRunner.query(`
      ALTER TABLE chats ADD CONSTRAINT CHK_chats_receiver_or_channel 
      CHECK (
        (receiverId IS NOT NULL AND channelId IS NULL) OR 
        (receiverId IS NULL AND channelId IS NOT NULL)
      )
    `);

    // Create indexes
    await queryRunner.createIndex("chats", new Index("IDX_chats_sender_id", ["senderId"]));

    await queryRunner.createIndex("chats", new Index("IDX_chats_receiver_id", ["receiverId"]));

    await queryRunner.createIndex("chats", new Index("IDX_chats_channel_id", ["channelId"]));

    await queryRunner.createIndex("chats", new Index("IDX_chats_created_at", ["createdAt"]));

    await queryRunner.createIndex("chats", new Index("IDX_chats_deleted_at", ["deletedAt"]));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("chats");
  }
}
