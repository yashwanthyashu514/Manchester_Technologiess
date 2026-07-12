import dotenv from 'dotenv';
dotenv.config();

import { initDb, dbQuery } from '../server/database.js';

async function main() {
  console.log('🔄 Running initDb()...');
  try {
    await initDb();
    console.log('✅ initDb() completed successfully.');

    // Query application_status table
    const appStatusRows = await dbQuery('SELECT COUNT(*) as count FROM application_status');
    console.log('📊 application_status count:', appStatusRows);

    // Query digital_signatures table
    const sigRows = await dbQuery('SELECT COUNT(*) as count FROM digital_signatures');
    console.log('📊 digital_signatures count:', sigRows);

    console.log('🎉 Database verification complete.');
  } catch (err) {
    console.error('❌ Database verification failed:', err);
  }
}

main();
