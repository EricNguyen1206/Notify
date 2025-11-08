import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from "typeorm";

export class CreateChannels1700000002 implements MigrationInterface {
  name = "CreateChannels1700000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "channels",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "ownerId",
            type: "int",
            isNullable: false,
          },
          {
            name: "type",
            type: "enum",
            enum: ["direct", "group"],
            default: "'group'",
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
      "channels",
      new ForeignKey({
        columnNames: ["ownerId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    // Create indexes
    await queryRunner.createIndex("channels", new Index("IDX_channels_owner_id", ["ownerId"]));

    await queryRunner.createIndex("channels", new Index("IDX_channels_type", ["type"]));

    await queryRunner.createIndex("channels", new Index("IDX_channels_deleted_at", ["deletedAt"]));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("channels");
  }
}
