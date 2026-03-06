import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1772825862712 implements MigrationInterface {
    name = 'Update1772825862712'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_Member_userid_name" ON "Member" ("userid", "name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_Member_userid_name"`);
    }

}
