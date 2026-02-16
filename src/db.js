const {DataTypes, sequelize, Sequelize} = require('sequelize');
const {env} = require('dotenv');

env.config();

const password = process.env.POSTGRES_PASSWORD;

if (!password) {
    console.error("Missing POSTGRES_PWD environment variable.");
    process.exit(1);
}

const database = {

    sequelize: new Sequelize('postgres', 'postgres', password, {
        host: 'localhost',
        logging: false,
        dialect: 'postgres'
    }),

    Sequelize: Sequelize,

    members: sequelize.define('Member', {
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
    }),

    systems: sequelize.define('System', {
        userid: {
            type: DataTypes.STRING,
        },
        fronter: {
            type: DataTypes.STRING
        },
        grouptag: {
            type: DataTypes.STRING
        },
        autoproxy: {
            type: DataTypes.BOOLEAN,
        }
    }),

    /**
     * Checks Sequelize database connection.
     */
    check_connection: async function () {
        await sequelize.authenticate().then(async () => {
            console.log('Connection has been established successfully.');
            await this.syncModels();
        }).catch(err => {
            console.error('Unable to connect to the database:', err);
            process.exit(1);
        });
    },

    /**
     * Syncs Sequelize models.
     */
    async syncModels() {
        await this.sequelize.sync().then(() => {
            console.log('Models synced successfully.');
        }).catch((err) => {
            console.error('Syncing models did not work', err);
            process.exit(1);
        });
    }
};

module.exports = database;