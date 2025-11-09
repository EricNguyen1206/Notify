import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateMessages1700000003 implements MigrationInterface {
  name = "CreateMessages1700000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "messages",
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("messages");
  }
}
