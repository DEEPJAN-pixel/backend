const pool = require("./db");

async function createStudentsTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      password VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    console.log("Students table created successfully.");
    process.exit();
}

createStudentsTable();
