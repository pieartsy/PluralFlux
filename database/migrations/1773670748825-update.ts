import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1773670748825 implements MigrationInterface {
    name = 'Update1773670748825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "System" ("id" SERIAL NOT NULL, "userid" character varying NOT NULL, "name" character varying(100), "fronter" character varying(100), "grouptag" character varying, "autoproxy" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_System_shortid" UNIQUE ("shortid"), CONSTRAINT "UQ_System_userid" UNIQUE ("userid"), CONSTRAINT "PK_System" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "System"`);
    }

}
