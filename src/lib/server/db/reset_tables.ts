import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL
});

async function reset() {
    console.log('Resetting public schema (DROP CASCADE)...');
    try {
        await pool.query('DROP SCHEMA public CASCADE;');
        await pool.query('CREATE SCHEMA public;');
        await pool.query('GRANT ALL ON SCHEMA public TO public;');
        await pool.query('ALTER SCHEMA public OWNER TO pg_database_owner;'); 
        // Note: The owner might vary, but usually current user or postgres. 
        // This line is optional but good practice if supported. 
        // If it fails, ignore it.
        
        console.log('Public schema reset successfully.');
    } catch (err) {
        // Ignore "role does not exist" errors for owner, it's fine
        if (err.code === '42704') { // undefined_object
             console.log('Schema reset, warning on permissions/roles ignored.');
        } else {
             console.error('Error resetting schema:', err);
        }
    } finally {
        await pool.end();
    }
}

reset();
