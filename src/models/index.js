const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  timezone: '+09:00',
  logging: false,
  dialectOptions: {
    charset: 'utf8mb4'
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
});

const File = require('./File')(sequelize);

module.exports = {
  sequelize,
  File
};
