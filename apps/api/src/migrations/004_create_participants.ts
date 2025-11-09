import { MigrationInterface, QueryRunner, Table, Index, ForeignKey, Unique } from "typeorm";

export class CreateChannelMembers1700000004 implements MigrationInterface {
  name = "CreateChannelMembers1700000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "channel_members",
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
            name: "channelId",
            type: "int",
            isNullable: false,
          },
          {
            name: "joinedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("channel_members");
  }
}
