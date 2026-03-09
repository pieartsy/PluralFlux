import "reflect-metadata"
import { DataSource } from "typeorm"
import * as env from 'dotenv';
import * as path from "path";

env.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_ENDPOINT,
    port: 5432,
    username: "postgres",
    password: process.env.POSTGRES_PASSWORD,
    database: "postgres",
    synchronize: false,
    logging: false,
    entities: [path.join(__dirname, "./entity/*.{ts,js}")],
    migrations: [path.join(__dirname, "./migrations/*.{ts,js}")],
    migrationsRun: true,
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all',
    invalidWhereValuesBehavior: {
        null: "sql-null",
        undefined: "throw",
    },
});
