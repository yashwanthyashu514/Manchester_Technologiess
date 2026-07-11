import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'server', 'data', 'portal.db');

const db = new sqlite3.Database(dbPath);

const sql = `SELECT id, application_id, full_name, email, phone, college_name, preferred_domain, preferred_duration, status, created_at, termsAccepted FROM applications`;
db.all(sql, [], (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Query returned ${rows.length} rows.`);
    if (rows.length > 0) {
      console.log('Sample row:', rows[0]);
    }
  }
  db.close();
});
