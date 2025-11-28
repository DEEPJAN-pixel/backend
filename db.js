 import mysql from "mysql2";
// REMOVED: import fs from "fs"; // No longer needed
import dotenv from "dotenv";
dotenv.config();

// 1. Conditionally build the SSL configuration object
// It checks for a new environment variable (DB_CA_CERT) which will hold the certificate's text content.
let sslConfig = process.env.DB_CA_CERT 
    ? { 
        ca: process.env.DB_CA_CERT, // Reads the entire certificate string from the ENV var
        rejectUnauthorized: true 
    }
    : {}; // If the variable is missing, it passes an empty object, so MySQL connects without SSL

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    
    // 2. Spread the SSL configuration safely
    ...sslConfig, 
});

// Optional: Add a safety check to log connection status on server startup
pool.getConnection()
    .then(connection => {
        console.log("Database connection pool established successfully.");
        connection.release();
    })
    .catch(err => {
        // This will print the exact database error in your server logs!
        console.error("FATAL: Failed to establish database connection. CHECK ENV VARIABLES AND FIREWALL.", err);
    });

export default pool.promise();