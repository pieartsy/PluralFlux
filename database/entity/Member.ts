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
        nullable: true,
    })
    displayname: number

    @Column({
        nullable: true,
    })
    proxy: number

    @Column({
        nullable: true,
    })
    propic: number

    @Column()
    createdAt: Date

    @Column()
    updatedAt: Date

    @Column()
    systemid: string
}
