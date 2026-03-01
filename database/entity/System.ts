import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity({name: "Systems", synchronize: true})
export class System {

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
