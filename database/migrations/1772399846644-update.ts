import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1772399846644 implements MigrationInterface {
    name = 'Update1772399846644'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "members" ("id" SERIAL NOT NULL, "userid" character varying NOT NULL, "name" character varying(100) NOT NULL, "displayname" character varying(100), "proxy" character varying, "propic" character varying, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_28b53062261b996d9c99fa12404" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "systems" ("id" SERIAL NOT NULL, "userid" character varying NOT NULL, "fronter" character varying NOT NULL, "grouptag" character varying NOT NULL, "autoproxy" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_aec3139aedeb09c5ae27f2c94d3" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "systems"`);
        await queryRunner.query(`DROP TABLE "members"`);
    }

}
