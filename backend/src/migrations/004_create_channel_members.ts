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

    // Create foreign key constraints
    await queryRunner.createForeignKey(
      "channel_members",
      new ForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "channel_members",
      new ForeignKey({
        columnNames: ["channelId"],
        referencedColumnNames: ["id"],
        referencedTableName: "channels",
        onDelete: "CASCADE",
      })
    );

    // Create unique constraint for (userId, channelId)
    await queryRunner.createUniqueConstraint(
      "channel_members",
      new Unique("UQ_channel_members_user_channel", ["userId", "channelId"])
    );

    // Create indexes
    await queryRunner.createIndex("channel_members", new Index("IDX_channel_members_user_id", ["userId"]));

    await queryRunner.createIndex("channel_members", new Index("IDX_channel_members_channel_id", ["channelId"]));

    await queryRunner.createIndex("channel_members", new Index("IDX_channel_members_joined_at", ["joinedAt"]));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("channel_members");
  }
}
