import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1773749921832 implements MigrationInterface {
    name = 'Update1773749921832'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "System" ("userid") SELECT DISTINCT "userid" FROM "Member";`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE from "System" USING "Member" WHERE "System".userid = "Member".userid;`);
    }
}
