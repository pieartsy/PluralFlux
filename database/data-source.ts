import "reflect-metadata"
import { DataSource } from "typeorm"
import { Member } from "./entity/Member"
import { System } from "./entity/System"
import * as env from 'dotenv';

env.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: process.env.POSTGRES_PASSWORD,
    database: "postgres",
    synchronize: true,
    logging: false,
    entities: [Member, System],
    migrations: [],
    subscribers: [],
})
