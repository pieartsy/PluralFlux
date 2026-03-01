import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Member {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    userid: string

    @Column()
    name: string

    @Column()
    displayname: number

    @Column()
    proxy: number

    @Column()
    propic: number
}
