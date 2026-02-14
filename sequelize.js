import {DataTypes, Sequelize} from 'sequelize';

const password = process.env.POSTGRES_PASSWORD;

if (!password) {
    console.error("Missing POSTGRES_PWD environment variable.");
    process.exit(1);
}

const database = {};

const sequelize = new Sequelize('postgres', 'postgres', password, {
    host: 'localhost',
    dialect: 'postgres'
});

database.sequelize = sequelize;
database.Sequelize = Sequelize;

database.members = sequelize.define('Member', {
    userid: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    displayname: {
        type: DataTypes.STRING,
    },
    propic: {
        type: DataTypes.STRING,
    },
    proxy: {
        type: DataTypes.STRING,
    }
});

/**
 * Checks Sequelize database connection.
 */
database.check_connection = async function() {
        await sequelize.authenticate().then(async (result) => {
            console.log('Connection has been established successfully.');
            await syncModels();
        }).catch(err => {
            console.error('Unable to connect to the database:', err);
            process.exit(1);
        });
}

/**
 * Syncs Sequelize models.
 */
async function syncModels() {
    await sequelize.sync().then(() => {
        console.log('Models synced successfully.');
    }).catch((err) => {
        console.error('Syncing models did not work', err);
        process.exit(1);
    });
}

export const db = database;