import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1772830252670 implements MigrationInterface {
    name = 'Update1772830252670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Member" ADD CONSTRAINT "UQ_Member_userid_name" UNIQUE ("userid", "name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Member" DROP CONSTRAINT "UQ_Member_userid_name"`);
    }

}
