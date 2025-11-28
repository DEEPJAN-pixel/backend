import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

// 1. CRITICAL CHECK: If essential environment variables are missing,
// the createPool call might fail. This check forces a clear crash log.
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error("FATAL ERROR: One or more critical database environment variables (DB_HOST, DB_USER, DB_PASSWORD) are missing on the host environment.");
    // This will stop the application with a clearer message in the deploy logs.
    throw new Error("Missing database configuration environment variables.");
}

// Safely define SSL configuration from environment variable
let sslConfig = process.env.DB_CA_CERT
    ? {
        ca: process.env.DB_CA_CERT,
        rejectUnauthorized: true
    }
    : {};

// If createPool fails, it usually throws a synchronous error, which we rely on here.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,

    // Safely apply the SSL config
    ...sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// REMOVED: The problematic pool.getConnection().then().catch() block.
// This check was crashing the app because 'pool' was undefined. 
// The connection will now be checked implicitly when a route calls pool.query().

// Export the promise-wrapped pool for use in all routes
export default pool.promise();