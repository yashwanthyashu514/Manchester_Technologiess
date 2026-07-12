import pg from 'pg';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = !!process.env.VERCEL;

const DATA_DIR = isVercel ? '/tmp/data' : path.join(__dirname, 'data');
const UPLOADS_DIR = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
const CERTS_DIR = isVercel ? '/tmp/certificates' : path.join(__dirname, 'certificates');

// Ensure SQLite directories exist locally (safe try-catch for read-only serverless filesystems)
const ensureDirExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    console.warn(`⚠️ Warning: Could not create directory ${dirPath}. If running on serverless environments like Vercel, this is normal and expected.`, err.message);
  }
};

ensureDirExists(DATA_DIR);
ensureDirExists(UPLOADS_DIR);
ensureDirExists(CERTS_DIR);

// Check database mode
const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = !!DATABASE_URL;

let db = null;
let pgPool = null;

export const getPgPool = () => {
  if (!pgPool && isPostgres) {
    console.log('🔌 Database Mode: PostgreSQL cloud pool initialized.');
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Necessary for Neon / Supabase serverless connections
      }
    });
  }
  return pgPool;
};

export const getSqliteDb = async () => {
  if (!db && !isPostgres) {
    console.log('📁 Database Mode: Local SQLite database initialized.');
    let sqlite3;
    try {
      sqlite3 = (await import('sqlite3')).default;
    } catch (err) {
      console.error('Failed to dynamically load sqlite3 database driver:', err);
      throw err;
    }
    const dbPath = path.join(DATA_DIR, 'portal.db');

    // On Vercel, copy pre-existing database from the bundle to the writable /tmp/data directory
    if (isVercel) {
      const bundleDbPath = path.join(__dirname, 'data', 'portal.db');
      if (fs.existsSync(bundleDbPath) && !fs.existsSync(dbPath)) {
        try {
          fs.copyFileSync(bundleDbPath, dbPath);
          console.log(`📋 Copied bundle portal.db to writable path: ${dbPath}`);
        } catch (copyErr) {
          console.error('Failed to copy bundled database to /tmp:', copyErr);
        }
      }
    }

    db = new sqlite3.Database(dbPath);
  }
  return db;
};

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
      const pool = getPgPool();
      const res = await pool.query(pgSql, params);
      return res.rows;
    } catch (err) {
      console.error(`PostgreSQL Query Error: [${pgSql}]`, err);
      throw err;
    }
  } else {
    const sqliteDb = await getSqliteDb();
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
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
      const pool = getPgPool();
      const res = await pool.query(pgSql, params);
      return res.rows[0] || null;
    } catch (err) {
      console.error(`PostgreSQL Get Error: [${pgSql}]`, err);
      throw err;
    }
  } else {
    const sqliteDb = await getSqliteDb();
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
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
      const pool = getPgPool();
      const res = await pool.query(pgSql, params);
      return { id: null, changes: res.rowCount };
    } catch (err) {
      console.error(`PostgreSQL Run Error: [${pgSql}]`, err);
      throw err;
    }
  } else {
    const sqliteDb = await getSqliteDb();
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function(err) {
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
      status VARCHAR(50) DEFAULT 'Submitted',
      created_at TEXT NOT NULL,
      updated_at TEXT,
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
    { name: 'additional_comments', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'resume_data', type: 'TEXT' },
    { name: 'portfolio_data', type: 'TEXT' },
    { name: 'docs_data', type: 'TEXT' },
    { name: 'termsAccepted', type: 'INTEGER DEFAULT 0' },
    { name: 'signedAt', type: 'TEXT' },
    { name: 'signatureImage', type: 'TEXT' },
    { name: 'signedPdfGenerated', type: 'INTEGER DEFAULT 0' },
    { name: 'signatureAuditLog', type: 'TEXT' },
    { name: 'browserInfo', type: 'TEXT' },
    { name: 'deviceInfo', type: 'TEXT' },
    { name: 'ipAddress', type: 'TEXT' },
    { name: 'signedPdfVersion', type: 'TEXT' },
    { name: 'mentor_id', type: 'INTEGER' },
    { name: 'mentor_name', type: 'TEXT' }
  ];


  for (const col of newColumns) {
    try {
      await dbRun(`ALTER TABLE applications ADD COLUMN ${col.name} ${col.type}`);
      console.log(`✅ Added column ${col.name} to applications table.`);
    } catch (err) {
      // Column already exists or error, safe to ignore
    }
  }

  // Migrate any existing 'Pending' statuses to 'Submitted'
  try {
    const migrated = await dbRun(`UPDATE applications SET status = 'Submitted' WHERE status = 'Pending'`);
    if (migrated && migrated.changes > 0) {
      console.log(`✅ Migrated ${migrated.changes} applications from Pending to Submitted.`);
    }
  } catch (err) {
    console.warn('⚠️ Warning: Failed to run status migration.', err.message);
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

  // Application Status Table (Admin-managed simplified status tracking)
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS application_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id VARCHAR(50) NOT NULL,
      email TEXT NOT NULL,
      candidate_name TEXT NOT NULL,
      domain TEXT,
      mentor TEXT,
      status VARCHAR(50) DEFAULT 'Under Review',
      start_date TEXT,
      reporting_details TEXT,
      remarks TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  // Digital Signatures Table (MT-SIGN certificate ID tracking)
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS digital_signatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_id VARCHAR(50) UNIQUE NOT NULL,
      application_id VARCHAR(50) NOT NULL,
      email TEXT NOT NULL,
      candidate_name TEXT,
      domain TEXT,
      signature_image TEXT,
      signed_at TEXT NOT NULL,
      ip_address TEXT,
      browser_info TEXT,
      document_path TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Migrate digital_signatures columns if table already exists
  const digSigColumns = [
    { name: 'candidate_name', type: 'TEXT' },
    { name: 'domain', type: 'TEXT' },
    { name: 'document_path', type: 'TEXT' }
  ];
  for (const col of digSigColumns) {
    try {
      await dbRun(`ALTER TABLE digital_signatures ADD COLUMN ${col.name} ${col.type}`);
    } catch (err) { /* column already exists */ }
  }

  // Migrate application_status columns if table already exists
  const appStatusColumns = [
    { name: 'reporting_details', type: 'TEXT' },
    { name: 'remarks', type: 'TEXT' },
    { name: 'application_id', type: 'VARCHAR(50)' }
  ];
  for (const col of appStatusColumns) {
    try {
      await dbRun(`ALTER TABLE application_status ADD COLUMN ${col.name} ${col.type}`);
    } catch (err) { /* column already exists */ }
  }

  // Populate application_id from tracking_id if it exists and application_id is null (for backward compatibility)
  try {
    await dbRun(`UPDATE application_status SET application_id = tracking_id WHERE application_id IS NULL OR application_id = ''`);
  } catch (err) { /* ignore if column tracking_id doesn't exist */ }

  // Mentors Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS mentors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      domain TEXT,
      status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Disabled'
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  // Seed Predefined Mentors
  const mentorsToSeed = [
    { email: 'pallavids359@gmail.com', full_name: 'Pallavi D S', domain: 'Full Stack' },
    { email: 'r23616901@gmail.com', full_name: 'Mentor R', domain: 'AI/ML' },
    { email: 'dgprateeksha01@gmail.com', full_name: 'Prateeksha D G', domain: 'Data Science' }
  ];
  const defaultMentorHash = bcrypt.hashSync('Mentor@2026', 10);
  for (const mentor of mentorsToSeed) {
    try {
      const mentorExists = await dbGet(`SELECT id FROM mentors WHERE email = ?`, [mentor.email]);
      if (!mentorExists) {
        await dbRun(`
          INSERT INTO mentors (email, password_hash, full_name, domain, status, created_at)
          VALUES (?, ?, ?, ?, 'Active', ?)
        `, [mentor.email, defaultMentorHash, mentor.full_name, mentor.domain, new Date().toISOString()]);
        console.log(`👤 Seeded predefined mentor: ${mentor.email}`);
      }
    } catch (err) {
      console.error('Error seeding mentor:', err);
    }
  }

  // Weekly Reports Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS weekly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id VARCHAR(50) NOT NULL,
      week_number INTEGER NOT NULL,
      work_completed TEXT NOT NULL,
      tasks_accomplished TEXT NOT NULL,
      technologies_learned TEXT, -- Comma-separated tags
      evidence_path TEXT,
      evidence_data TEXT, -- Base64 representation of evidence files
      github_url TEXT,
      deployment_url TEXT,
      challenges_faced TEXT,
      learning_outcome TEXT,
      next_week_plan TEXT,
      hours_worked INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Resubmission Required'
      feedback TEXT,
      score INTEGER,
      submitted_at TEXT NOT NULL,
      reviewed_at TEXT,
      mentor_id INTEGER,
      FOREIGN KEY(application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
      FOREIGN KEY(mentor_id) REFERENCES mentors(id)
    )
  `);

  // Meetings Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      meeting_date TEXT NOT NULL,
      meeting_time TEXT NOT NULL,
      meet_link TEXT NOT NULL,
      meeting_type VARCHAR(50) NOT NULL, -- 'All Interns', 'Domain Based', 'Group Based', 'Individual Intern'
      target_domain TEXT,
      target_mentor_id INTEGER,
      target_application_id VARCHAR(50),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Attendance Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      application_id VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL, -- 'Present', 'Absent', 'Excused'
      marked_by TEXT NOT NULL,
      marked_at TEXT NOT NULL,
      FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
      FOREIGN KEY(application_id) REFERENCES applications(application_id) ON DELETE CASCADE
    )
  `);

  // Announcements Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      attachment_path TEXT,
      attachment_data TEXT, -- Base64
      meet_link TEXT,
      audience_type VARCHAR(50) NOT NULL, -- 'All Interns', 'Domain', 'Group'
      target_domain TEXT,
      target_mentor_id INTEGER,
      created_by TEXT NOT NULL, -- e.g. 'Manchester Technologies Official' or Mentor name
      created_at TEXT NOT NULL
    )
  `);

  // Group Messages Table (communication channels)
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS group_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_type VARCHAR(50) NOT NULL, -- 'Global', 'Domain', 'Mentor'
      channel_name VARCHAR(100) NOT NULL, -- 'Global', 'AI/ML', etc.
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role VARCHAR(50) NOT NULL, -- 'admin', 'mentor', 'intern'
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Notifications Table
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id VARCHAR(50), -- NULL if global
      mentor_id INTEGER, -- NULL if global
      role VARCHAR(50), -- 'admin', 'mentor', 'intern'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  // Activity Logs Table (Security and auditing)
  await runInitQuery(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      role VARCHAR(50) NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
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
