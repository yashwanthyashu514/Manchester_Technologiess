import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'server', 'data', 'portal.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to SQLite database.');
});

db.all("PRAGMA table_info(applications)", (err, rows) => {
  if (err) {
    console.error('Error querying table info:', err);
    return;
  }
  console.log('--- Columns in applications table ---');
  rows.forEach(row => {
    console.log(`${row.name} (${row.type})`);
  });
  db.close();
});
