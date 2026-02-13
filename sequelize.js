import { Sequelize } from 'sequelize';

const password = process.env.FLUXER_BOT_TOKEN;

if (!password) {
    console.error("Missing POSTGRES_PWD environment variable.");
    process.exit(1);
}

const database = {};
console.log(password)

const sequelize = new Sequelize('pf-postgres', 'postgres', password, {
    host: 'localhost',
    dialect: 'postgres'
});

database.sequelize = sequelize;
database.Sequelize = Sequelize;

database.checkConnection = async function() {
        await sequelize.authenticate().then((result) => {
            console.log('Connection has been established successfully.');
        }).catch(err => {
            console.error('Unable to connect to the database:', err);
            process.exit(1);
        });
}

export const db = database;