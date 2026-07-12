import { initDb } from './database.js'

async function run() {
  console.log('🔌 Running Database Init Script...')
  try {
    await initDb()
    console.log('✅ Database Initialization complete!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Database Initialization failed:', err)
    process.exit(1)
  }
}

run()
