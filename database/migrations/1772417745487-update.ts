import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1772417745487 implements MigrationInterface {
    name = 'Update1772417745487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Member" ("id" SERIAL NOT NULL, "userid" character varying NOT NULL, "name" character varying(100) NOT NULL, "displayname" character varying(100), "proxy" character varying, "propic" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_235428a1d87c5f639ef7b7cf170" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Member"`);
    }

}
