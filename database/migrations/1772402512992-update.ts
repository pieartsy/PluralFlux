import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1772402512992 implements MigrationInterface {
    name = 'Update1772402512992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "System" ("id" SERIAL NOT NULL, "userid" character varying NOT NULL, "fronter" character varying NOT NULL, "grouptag" character varying NOT NULL, "autoproxy" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_b8e3f6855de5a4758fcb59e5567" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Member" ("id" SERIAL NOT NULL, "userid" character varying NOT NULL, "name" character varying(100) NOT NULL, "displayname" character varying(100), "proxy" character varying, "propic" character varying, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_235428a1d87c5f639ef7b7cf170" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Member"`);
        await queryRunner.query(`DROP TABLE "System"`);
    }

}
