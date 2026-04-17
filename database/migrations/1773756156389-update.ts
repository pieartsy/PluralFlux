import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1773756156389 implements MigrationInterface {
    name = 'Update1773756156389'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Member" ADD "systemid" integer`);
        await queryRunner.query(`ALTER TABLE "Member" ADD CONSTRAINT "FK_Member_System" FOREIGN KEY ("systemid") REFERENCES "System"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Member" DROP CONSTRAINT "FK_Member_System"`);
        await queryRunner.query(`ALTER TABLE "Member" DROP COLUMN "systemid"`);
    }

}
