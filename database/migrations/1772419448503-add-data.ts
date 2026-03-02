import { MigrationInterface, QueryRunner } from "typeorm";

export class AddData1772419448503 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "Member"(id, userid, name,displayname, proxy, propic, "createdAt", "updatedAt") SELECT id,userid, name,displayname, proxy, propic, "createdAt", "updatedAt" FROM "Members";`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`TRUNCATE TABLE "Member"`);
    }
}