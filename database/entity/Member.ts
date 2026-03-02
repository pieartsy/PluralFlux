import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from "typeorm"

@Entity({name: "Member", synchronize: true})
export class Member {

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

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date
}
