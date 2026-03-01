import "reflect-metadata"
import { DataSource } from "typeorm"
import * as env from 'dotenv';

env.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: process.env.POSTGRES_PASSWORD,
    database: "postgres",
    synchronize: false,
    logging: false,
    migrations: [__dirname + '/migration/**/*{.js,.ts}'],
    entities: ["dist/entities/**/*.js"], // Point to compiled JS files
    subscribers: ["dist/subscribers/**/*.js"],
    migrationsRun: true,
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all'
})
