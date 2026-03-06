import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteDuplicates1772825438973 implements MigrationInterface {
    name= "DeleteDuplicates1772825438973"
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE
                                 FROM "Member" a USING "Member" b
                                 WHERE a.id
                                     > b.id
                                   AND a.name = b.name
                                   AND a.userid = b.userid;`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
