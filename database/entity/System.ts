import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
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
}
