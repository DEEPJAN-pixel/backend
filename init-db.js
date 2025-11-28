const db = require("./db");

async function createTables() {
    try {
        console.log("Creating tables...");

        // 1) Users (shared for students/employers/mentors/admins)
        await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('student','employer','mentor','admin') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 2) Students
        await db.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        full_name VARCHAR(100),
        university VARCHAR(150),
        program VARCHAR(150),
        bio TEXT,
        profile_image_url VARCHAR(500),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

        // 3) Employers
        await db.query(`
      CREATE TABLE IF NOT EXISTS employers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        company_name VARCHAR(150) NOT NULL,
        logo_url VARCHAR(500),
        website VARCHAR(255),
        location VARCHAR(255),
        bio TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

        // 4) Mentors
        await db.query(`
      CREATE TABLE IF NOT EXISTS mentors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        full_name VARCHAR(100),
        expertise VARCHAR(255),
        bio TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

        // 5) Internships
        await db.query(`
      CREATE TABLE IF NOT EXISTS internships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employer_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        mode ENUM('onsite','remote','hybrid') DEFAULT 'onsite',
        type ENUM('full-time','part-time','internship') DEFAULT 'internship',
        stipend VARCHAR(100),
        start_date DATE,
        end_date DATE,
        status ENUM('open','closed') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE
      )
    `);

        // 6) Applications
        await db.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        internship_id INT NOT NULL,
        student_id INT NOT NULL,
        cover_letter TEXT,
        status ENUM('applied','shortlisted','rejected','accepted') DEFAULT 'applied',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

        // 7) Mentor tasks
        await db.query(`
      CREATE TABLE IF NOT EXISTS mentor_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mentor_id INT NOT NULL,
        student_id INT NOT NULL,
        internship_id INT,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        due_date DATE,
        status ENUM('pending','in_progress','completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE SET NULL
      )
    `);

        console.log("✅ All tables created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating tables:", err);
        process.exit(1);
    }
}

createTables();
