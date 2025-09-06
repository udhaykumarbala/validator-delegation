#!/usr/bin/env node
/**
 * Script to fix missing columns in the PostgreSQL database
 * This adds identity, security_contact, and details columns if they don't exist
 */

require('dotenv').config();
const { Pool } = require('pg');

async function fixDatabaseColumns() {
    console.log('===== DATABASE COLUMN FIX SCRIPT =====\n');
    
    // Check if using PostgreSQL
    if (process.env.DB_TYPE !== 'postgres' && !process.env.DATABASE_URL) {
        console.log('This script is only for PostgreSQL databases.');
        console.log('Your current DB_TYPE is:', process.env.DB_TYPE || 'sqlite');
        return;
    }
    
    // Create connection pool
    const pool = process.env.DATABASE_URL 
        ? new Pool({ connectionString: process.env.DATABASE_URL })
        : new Pool({
            user: process.env.DB_USER || 'validator_user',
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'validator_db'
        });
    
    try {
        console.log('Connecting to PostgreSQL database...');
        
        // Check current columns
        const checkQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'delegation_requests'
            ORDER BY ordinal_position
        `;
        
        const currentColumns = await pool.query(checkQuery);
        console.log('\nCurrent columns in delegation_requests table:');
        currentColumns.rows.forEach(row => console.log('  -', row.column_name));
        
        // Define columns to add
        const columnsToAdd = [
            { name: 'identity', type: 'VARCHAR(255)' },
            { name: 'security_contact', type: 'VARCHAR(255)' },
            { name: 'details', type: 'TEXT' },
            { name: 'website', type: 'VARCHAR(255)' }
        ];
        
        const existingColumns = currentColumns.rows.map(r => r.column_name);
        const missingColumns = columnsToAdd.filter(col => !existingColumns.includes(col.name));
        
        if (missingColumns.length === 0) {
            console.log('\n✅ All required columns already exist!');
        } else {
            console.log('\n⚠️  Missing columns found:', missingColumns.map(c => c.name).join(', '));
            console.log('\nAdding missing columns...');
            
            for (const column of missingColumns) {
                try {
                    const alterQuery = `ALTER TABLE delegation_requests ADD COLUMN ${column.name} ${column.type}`;
                    await pool.query(alterQuery);
                    console.log(`✅ Added column: ${column.name}`);
                } catch (error) {
                    if (error.code === '42701') { // Column already exists
                        console.log(`ℹ️  Column ${column.name} already exists`);
                    } else {
                        throw error;
                    }
                }
            }
            
            console.log('\n✅ Database schema updated successfully!');
        }
        
        // Verify final schema
        console.log('\nVerifying final schema...');
        const verifyQuery = `
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'delegation_requests'
            AND column_name IN ('identity', 'security_contact', 'details', 'website', 'moniker', 'pubkey')
            ORDER BY column_name
        `;
        
        const finalColumns = await pool.query(verifyQuery);
        console.log('\nKey columns in delegation_requests:');
        finalColumns.rows.forEach(row => {
            const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
            console.log(`  - ${row.column_name}: ${row.data_type}${length}`);
        });
        
        // Test with a sample query
        console.log('\nTesting INSERT capability...');
        const testQuery = `
            SELECT COUNT(*) as count 
            FROM information_schema.columns 
            WHERE table_name = 'delegation_requests' 
            AND column_name IN ('identity', 'security_contact', 'details')
        `;
        
        const testResult = await pool.query(testQuery);
        if (testResult.rows[0].count === '3') {
            console.log('✅ All required columns are present and ready for use!');
        } else {
            console.log('⚠️  Some columns may still be missing. Count:', testResult.rows[0].count);
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Details:', error);
    } finally {
        await pool.end();
        console.log('\n===== SCRIPT COMPLETE =====');
    }
}

// Run the script
fixDatabaseColumns();