import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity({synchronize: true})
export class Members {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    userid: string

    @Column({
        length: 100
    })
    name: string

    @Column({
        type: "varchar",
        nullable: true,
        length: 100
    })
    displayname: string

    @Column({
        nullable: true,
    })
    proxy: string

    @Column({
        nullable: true,
    })
    propic: string

    @Column()
    createdAt: Date

    @Column()
    updatedAt: Date
}
