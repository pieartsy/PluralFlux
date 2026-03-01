import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1772409199699 implements MigrationInterface {
    name = 'Update1772409199699'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Systems" ("id" SERIAL NOT NULL, "userid" character varying NOT NULL, "fronter" character varying NOT NULL, "grouptag" character varying NOT NULL, "autoproxy" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_fab6605f84c0986f74b103c8499" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Members" ("id" SERIAL NOT NULL, "userid" character varying NOT NULL, "name" character varying(100) NOT NULL, "displayname" character varying(100), "proxy" character varying, "propic" character varying, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_9f2f12e5e39f9c534c6e4916002" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Members"`);
        await queryRunner.query(`DROP TABLE "Systems"`);
    }

}
