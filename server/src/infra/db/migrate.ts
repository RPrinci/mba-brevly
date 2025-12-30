import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { env } from '@/env'

async function runMigrations() {
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 })

  try {
    await migrate(drizzle(migrationClient), {
      migrationsFolder: 'src/infra/db/migrations',
    })
    console.log('✓ Migrations applied successfully!')
  } catch (error) {
    console.error('✗ Migration failed:', error)
    process.exit(1)
  } finally {
    await migrationClient.end()
  }
}

runMigrations()
