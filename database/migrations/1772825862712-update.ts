import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1772825862712 implements MigrationInterface {
    name = 'Update1772825862712'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d700ba02bb0e251101b04e1d05" ON "Member" ("userid", "name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_d700ba02bb0e251101b04e1d05"`);
    }

}
