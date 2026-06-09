import pg from 'pg';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CERTS_DIR = path.join(__dirname, 'certificates');

// Ensure SQLite directories exist locally
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(CERTS_DIR)) {
  fs.mkdirSync(CERTS_DIR, { recursive: true });
}

// Check database mode
const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = !!DATABASE_URL;

let db = null;
let pgPool = null;

if (isPostgres) {
  console.log('🔌 Database Mode: PostgreSQL cloud pool initialized.');
  pgPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necessary for Neon / Supabase serverless connections
    }
  });
} else {
  console.log('📁 Database Mode: Local SQLite database initialized.');
  let sqlite3;
  try {
    sqlite3 = (await import('sqlite3')).default;
  } catch (err) {
    console.error('Failed to dynamically load sqlite3 database driver:', err);
    throw err;
  }
  const dbPath = path.join(DATA_DIR, 'portal.db');
  db = new sqlite3.Database(dbPath);
}

// Helper: Translate '?' placeholders to '$1, $2, ...' for PostgreSQL queries
const convertSqlPlaceholders = (sql) => {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
};

// Query Wrappers
export const dbQuery = async (sql, params = []) => {
  if (isPostgres) {
    const pgSql = convertSqlPlaceholders(sql);
    try {
      const res = await pgPool.query(pgSql, params);
      return res.rows;
    } catch (err) {
      console.error(`PostgreSQL Query Error: [${pgSql}]`, err);
      throw err;
    }
  } else {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

export const dbGet = async (sql, params = []) => {
  if (isPostgres) {
    const pgSql = convertSqlPlaceholders(sql);
    try {
      const res = await pgPool.query(pgSql, params);
      return res.rows[0] || null;
    } catch (err) {
      console.error(`PostgreSQL Get Error: [${pgSql}]`, err);
      throw err;
    }
  } else {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

export const dbRun = async (sql, params = []) => {
  if (isPostgres) {
    const pgSql = convertSqlPlaceholders(sql);
    try {
      const res = await pgPool.query(pgSql, params);
      return { id: null, changes: res.rowCount };
    } catch (err) {
      console.error(`PostgreSQL Run Error: [${pgSql}]`, err);
      throw err;
    }
  } else {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

// Initialize Tables
export const initDb = async () => {
  const runInitQuery = async (sql) => {
    let finalSql = sql;
    if (isPostgres) {
      // Convert SQLite AUTOINCREMENT syntax to PostgreSQL SERIAL
      finalSql = sql
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
        // Remove check checks from SQLite syntax since PostgreSQL check works or we simplify
        .replace(/CHECK\(conf_agreement_1 = 1\)/gi, '')
        .replace(/CHECK\(conf_agreement_2 = 1\)/gi, '')
        .replace(/CHECK\(conf_agreement_3 = 1\)/gi, '')
        .replace(/CHECK\(conf_agreement_4 = 1\)/gi, '');
    }
    await dbRun(finalSql);
  };

  // Applications Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id VARCHAR(50) UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      address TEXT NOT NULL,
      college_name TEXT NOT NULL,
      university_name TEXT NOT NULL,
      department TEXT NOT NULL,
      semester TEXT NOT NULL,
      graduation_year INTEGER NOT NULL,
      cgpa TEXT NOT NULL,
      skills TEXT NOT NULL,
      technologies_known TEXT NOT NULL,
      programming_languages TEXT NOT NULL,
      github_profile TEXT,
      linkedin_profile TEXT,
      portfolio_url TEXT,
      preferred_domain TEXT NOT NULL,
      preferred_duration TEXT NOT NULL,
      start_date TEXT NOT NULL,
      resume_path TEXT NOT NULL,
      portfolio_path TEXT,
      docs_path TEXT,
      q_why_internship TEXT NOT NULL,
      q_tech_best TEXT NOT NULL,
      q_best_project TEXT NOT NULL,
      q_hours_per_day TEXT NOT NULL,
      q_why_select TEXT NOT NULL,
      q_career_goals TEXT NOT NULL,
      conf_agreement_1 INTEGER NOT NULL CHECK(conf_agreement_1 = 1),
      conf_agreement_2 INTEGER NOT NULL CHECK(conf_agreement_2 = 1),
      conf_agreement_3 INTEGER NOT NULL CHECK(conf_agreement_3 = 1),
      conf_agreement_4 INTEGER NOT NULL CHECK(conf_agreement_4 = 1),
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TEXT NOT NULL,
      ip_address TEXT,
      notes TEXT,
      email_notification_sent INTEGER DEFAULT 0,
      email_notification_error TEXT,
      country TEXT,
      degree TEXT,
      branch TEXT,
      certifications TEXT,
      previous_experience TEXT,
      experience_description TEXT,
      additional_comments TEXT
    )
  `);

  // Dynamic migration for existing databases
  const newColumns = [
    { name: 'country', type: 'TEXT' },
    { name: 'degree', type: 'TEXT' },
    { name: 'branch', type: 'TEXT' },
    { name: 'certifications', type: 'TEXT' },
    { name: 'previous_experience', type: 'TEXT' },
    { name: 'experience_description', type: 'TEXT' },
    { name: 'additional_comments', type: 'TEXT' }
  ];

  for (const col of newColumns) {
    try {
      await dbRun(`ALTER TABLE applications ADD COLUMN ${col.name} ${col.type}`);
      console.log(`✅ Added column ${col.name} to applications table.`);
    } catch (err) {
      // Column already exists or error, safe to ignore
    }
  }

  // Interviews Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id VARCHAR(50) UNIQUE NOT NULL,
      interview_date TEXT NOT NULL,
      interview_time TEXT NOT NULL,
      venue TEXT NOT NULL,
      online_link TEXT,
      instructions TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(application_id) REFERENCES applications(application_id) ON DELETE CASCADE
    )
  `);

  // Project Assignments Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS project_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id VARCHAR(50) UNIQUE NOT NULL,
      github_username TEXT NOT NULL,
      assigned_repository TEXT NOT NULL,
      repository_url TEXT NOT NULL,
      mentor_name TEXT NOT NULL,
      project_name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      tasks TEXT NOT NULL,
      mentor_feedback TEXT,
      FOREIGN KEY(application_id) REFERENCES applications(application_id) ON DELETE CASCADE
    )
  `);

  // Certificates Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id VARCHAR(50) UNIQUE NOT NULL,
      certificate_number VARCHAR(50) UNIQUE NOT NULL,
      candidate_name TEXT NOT NULL,
      domain TEXT NOT NULL,
      duration TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(application_id) REFERENCES applications(application_id)
    )
  `);

  // Admin Users Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Seed default admin accounts (strictly only one)
  const adminsToSeed = [
    { username: 'admin', email: 'manchestertechnologies@gmail.com' }
  ];

  const passwordHash = bcrypt.hashSync('Bery@0218', 10);

  // Explicitly remove the corporate placeholder account to ensure only one admin exists
  try {
    await dbRun(`DELETE FROM admins WHERE email = ?`, ['admin@manchestertechnologies.com']);
  } catch (err) {
    // Ignore error if database is not fully set up yet
  }

  for (const adminData of adminsToSeed) {
    const adminExists = await dbGet(`SELECT id FROM admins WHERE email = ?`, [adminData.email]);
    if (!adminExists) {
      await dbRun(`
        INSERT INTO admins (username, email, password_hash, created_at)
        VALUES (?, ?, ?, ?)
      `, [adminData.username, adminData.email, passwordHash, new Date().toISOString()]);
      console.log(`👤 Seeded default admin account: ${adminData.email} / Bery@0218`);
    } else {
      await dbRun(`
        UPDATE admins SET password_hash = ? WHERE email = ?
      `, [passwordHash, adminData.email]);
      console.log(`👤 Updated default admin account password: ${adminData.email} / Bery@0218`);
    }
  }
};

export default db;
