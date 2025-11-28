const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        ca: fs.readFileSync("./ca.pem"),  // MUST INCLUDE Aiven CA
        rejectUnauthorized: true
    }
});

module.exports = pool.promise();
