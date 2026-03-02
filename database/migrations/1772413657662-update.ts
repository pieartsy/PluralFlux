import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1772413657662 implements MigrationInterface {
    name = 'Update1772413657662'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Member" ("id" SERIAL NOT NULL, "userid" character varying NOT NULL, "name" character varying(100) NOT NULL, "displayname" character varying(100), "proxy" character varying, "propic" character varying, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_235428a1d87c5f639ef7b7cf170" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Member"`);
    }

}
