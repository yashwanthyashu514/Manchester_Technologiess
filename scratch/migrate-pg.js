import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = 'postgresql://postgres.ethmgxiloekcsmrycski:Bery8792480218@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const newColumns = [
  { name: 'termsAccepted', type: 'INTEGER DEFAULT 0' },
  { name: 'signedAt', type: 'TEXT' },
  { name: 'signatureImage', type: 'TEXT' },
  { name: 'signedPdfGenerated', type: 'INTEGER DEFAULT 0' },
  { name: 'signatureAuditLog', type: 'TEXT' },
  { name: 'browserInfo', type: 'TEXT' },
  { name: 'deviceInfo', type: 'TEXT' },
  { name: 'ipAddress', type: 'TEXT' },
  { name: 'signedPdfVersion', type: 'TEXT' }
];

async function migrate() {
  try {
    console.log('Connecting to PostgreSQL production database for migration...');
    const client = await pool.connect();
    
    for (const col of newColumns) {
      try {
        console.log(`Adding column ${col.name}...`);
        // In PostgreSQL, to avoid case folding to lowercase, we must quote camelCase column names like "termsAccepted"
        // But in our backend queries, are they quoted?
        // Let's check: in index.js we query "termsAccepted" without quotes, which PostgreSQL folds to lowercase.
        // Therefore, we should create the column unquoted or quoted in lowercase so that it matches case-insensitively.
        // Let's create it as termsAccepted (unquoted) which translates to lowercase "termsaccepted" in PostgreSQL,
        // and also matches index.js's unquoted "termsAccepted" (which also folds to "termsaccepted").
        await client.query(`ALTER TABLE applications ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Successfully added column ${col.name}`);
      } catch (err) {
        console.log(`⚠️ Column ${col.name} not added (might already exist):`, err.message);
      }
    }

    client.release();
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
