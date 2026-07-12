import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = 'postgresql://postgres.ethmgxiloekcsmrycski:Bery8792480218@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const client = await pool.connect();
    
    // Find candidate by name
    const res = await client.query("SELECT id, application_id, full_name, termsaccepted FROM applications WHERE full_name LIKE '%Shivaleela%'");
    console.log('Database rows matching Shivaleela:', res.rows);

    if (res.rows.length > 0) {
      const id = res.rows[0].id;
      // Fetch signed-tc details just like the API does
      const tcRes = await client.query(`
        SELECT id, application_id, full_name, email, status, termsaccepted, signedat, signatureimage, browserinfo, deviceinfo, ipaddress, signedpdfversion, signatureauditlog 
        FROM applications WHERE id = $1
      `, [id]);
      console.log('\nT&C Details response:', tcRes.rows[0]);
    }

    client.release();
  } catch (err) {
    console.error('Error running test:', err);
  } finally {
    await pool.end();
  }
}

run();
