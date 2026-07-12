import pg from 'pg'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATABASE_URL = process.env.DATABASE_URL
const isPostgres = !!DATABASE_URL

async function validate() {
  console.log('🔍 Starting Database Schema Validation...')
  
  if (isPostgres) {
    console.log('🔌 Validation target: PostgreSQL cloud database')
    const pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    
    try {
      const res = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `)
      const tables = res.rows.map(r => r.table_name)
      console.log('📋 Existing database tables:', tables)
      
      const required = ['applications', 'interviews', 'project_assignments', 'certificates', 'application_status', 'digital_signatures', 'mentors', 'weekly_reports', 'meetings', 'attendance', 'announcements', 'group_messages', 'notifications', 'activity_logs', 'admins']
      const missing = required.filter(t => !tables.includes(t))
      
      if (missing.length > 0) {
        console.error('❌ Missing tables in PostgreSQL database:', missing)
        process.exit(1)
      } else {
        console.log('✅ All PostgreSQL tables verified successfully!')
      }
      
      // Verify mentors count
      const mentorRes = await pool.query('SELECT count(*) as count FROM mentors')
      console.log(`👤 Active mentors seeded: ${mentorRes.rows[0].count}`)
      
    } catch (err) {
      console.error('❌ PostgreSQL validation error:', err.message)
      process.exit(1)
    } finally {
      await pool.end()
    }
  } else {
    console.log('📁 Validation target: SQLite database')
    const dbPath = path.join(__dirname, 'data', 'portal.db')
    const db = new sqlite3.Database(dbPath)
    
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
      if (err) {
        console.error('❌ SQLite read error:', err.message)
        process.exit(1)
      }
      
      const tables = rows.map(r => r.name)
      console.log('📋 Existing database tables:', tables)
      
      const required = ['applications', 'interviews', 'project_assignments', 'certificates', 'application_status', 'digital_signatures', 'mentors', 'weekly_reports', 'meetings', 'attendance', 'announcements', 'group_messages', 'notifications', 'activity_logs', 'admins']
      const missing = required.filter(t => !tables.includes(t))
      
      if (missing.length > 0) {
        console.error('❌ Missing tables in SQLite database:', missing)
        process.exit(1)
      } else {
        console.log('✅ All SQLite tables verified successfully!')
      }
      
      // Verify mentors count
      db.get('SELECT count(*) as count FROM mentors', [], (err, row) => {
        if (err) {
          console.error(err)
        } else {
          console.log(`👤 Active mentors seeded: ${row.count}`)
        }
        db.close()
      })
    })
  }
}

validate()
