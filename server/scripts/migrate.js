const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

// Create migrations table if it doesn't exist
const createMigrationsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await query(sql);
    console.log('Migrations table created successfully');
  } catch (error) {
    console.error('Error creating migrations table:', error);
    throw error;
  }
};

// Get list of executed migrations
const getExecutedMigrations = async () => {
  try {
    const result = await query('SELECT name FROM migrations ORDER BY executed_at');
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error getting executed migrations:', error);
    return [];
  }
};

// Execute a migration
const executeMigration = async (migrationName, sql) => {
  try {
    await query('BEGIN');

    // Execute the migration SQL
    await query(sql);

    // Record the migration as executed
    await query('INSERT INTO migrations (name) VALUES ($1)', [migrationName]);

    await query('COMMIT');
    console.log(`Migration ${migrationName} executed successfully`);
  } catch (error) {
    await query('ROLLBACK');
    console.error(`Error executing migration ${migrationName}:`, error);
    throw error;
  }
};

// Run all pending migrations
const runMigrations = async () => {
  try {
    // Create migrations table
    await createMigrationsTable();

    // Get list of migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();

    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(file => {
      const migrationName = path.parse(file).name;
      return !executedMigrations.includes(migrationName);
    });

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations found');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s)`);

    // Execute pending migrations
    for (const migrationFile of pendingMigrations) {
      const migrationName = path.parse(migrationFile).name;
      const migrationPath = path.join(migrationsDir, migrationFile);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      console.log(`Executing migration: ${migrationName}`);
      await executeMigration(migrationName, sql);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
};

// Create migrations directory if it doesn't exist
const initMigrations = () => {
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    console.log('Migrations directory created');
  }
};

// Main execution
if (require.main === module) {
  initMigrations();
  runMigrations().then(() => {
    console.log('Migration process completed');
    process.exit(0);
  }).catch(error => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runMigrations,
  createMigrationsTable,
  getExecutedMigrations,
  executeMigration
};
