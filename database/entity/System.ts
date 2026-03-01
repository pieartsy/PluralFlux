import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Systems {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    userid: string

    @Column()
    fronter: string

    @Column()
    grouptag: string

    @Column()
    autoproxy: boolean

    @Column()
    createdAt: Date

    @Column()
    updatedAt: Date
}
