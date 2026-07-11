import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = 'postgresql://postgres.ethmgxiloekcsmrycski:Bery8792480218@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('Connecting to PostgreSQL production database...');
    const client = await pool.connect();
    
    // Check columns
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'applications'
    `);
    console.log('--- Columns in production applications table ---');
    columnsRes.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type})`);
    });

    // Check count and select
    const countRes = await client.query(`SELECT COUNT(*) as count FROM applications`);
    console.log(`\nTotal rows: ${countRes.rows[0].count}`);

    // Run the actual select query to see if it works or fails
    try {
      const selectRes = await client.query(`
        SELECT id, application_id, full_name, email, phone, college_name, preferred_domain, preferred_duration, status, created_at, termsAccepted 
        FROM applications 
        LIMIT 1
      `);
      console.log('SELECT query succeeded! Row:', selectRes.rows[0]);
    } catch (selectErr) {
      console.error('SELECT query failed:', selectErr.message);
    }

    client.release();
  } catch (err) {
    console.error('Database connection or query failed:', err);
  } finally {
    await pool.end();
  }
}

test();
