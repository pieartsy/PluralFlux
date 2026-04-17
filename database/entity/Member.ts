import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
    ManyToOne,
    JoinColumn
} from "typeorm"
import {System} from "./System";

@Entity({name: "Member", synchronize: true})
@Unique("UQ_Member_userid_name", ['userid', 'name'])
export class Member {

    @PrimaryGeneratedColumn({primaryKeyConstraintName: "PK_Member"})
    id: number

    @Column()
    userid: string

    @ManyToOne(() => System, (system) => system.id, {eager: true, orphanedRowAction: "delete", cascade: true, onDelete: "SET NULL", onUpdate: "CASCADE"})
    @JoinColumn({ name: "systemid", foreignKeyConstraintName: "FK_Member_System"})
    system: System

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
