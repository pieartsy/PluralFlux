import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique} from "typeorm"

@Entity({name: "System", synchronize: true})
@Unique("UQ_System_userid", ['userid'])
@Unique("UQ_System_shortid", ['shortid'])
export class System {

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 10,
        nullable: true,
    })
    shortid: string

    @Column()
    userid: string

    @Column({
        length: 100,
        nullable: true
    })
    name: string

    @Column({
        type: "varchar",
        nullable: true,
        length: 100
    })
    fronter: string

    @Column({
        nullable: true,
    })
    grouptag: string

    @Column({
        nullable: true,
    })
    autoproxy: string

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date
}
