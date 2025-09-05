const { Pool } = require('pg');

class PostgresDatabase {
    constructor() {
        this.pool = null;
    }

    async initialize() {
        // Create connection pool
        const poolConfig = {
            connectionString: process.env.DATABASE_URL
        };
        
        // Only enable SSL in production or if explicitly requested
        if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL && process.env.DATABASE_URL.includes('ssl=true')) {
            poolConfig.ssl = { rejectUnauthorized: false };
        }
        
        this.pool = new Pool(poolConfig);

        // Test connection
        try {
            await this.pool.query('SELECT NOW()');
            console.log('Connected to PostgreSQL database');
        } catch (error) {
            console.error('Failed to connect to PostgreSQL:', error);
            throw error;
        }

        // Create tables if they don't exist
        await this.createTables();
    }

    async createTables() {
        const queries = [
            // delegation_requests table
            `CREATE TABLE IF NOT EXISTS delegation_requests (
                id VARCHAR(36) PRIMARY KEY,
                moniker VARCHAR(255) NOT NULL,
                website VARCHAR(255),
                pubkey TEXT NOT NULL UNIQUE,
                signature TEXT NOT NULL,
                commission_rate INTEGER NOT NULL,
                withdrawal_fee INTEGER NOT NULL,
                operator_name VARCHAR(255) NOT NULL,
                operator_email VARCHAR(255) NOT NULL,
                operator_wallet VARCHAR(255) NOT NULL,
                operator_telegram VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                network VARCHAR(50) DEFAULT 'mainnet',
                validator_address VARCHAR(255),
                creation_tx_hash VARCHAR(255),
                creation_tx_date TIMESTAMP,
                transfer_tx_hash VARCHAR(255),
                transfer_tx_date TIMESTAMP,
                notes TEXT,
                reviewer VARCHAR(255),
                review_date TIMESTAMP,
                request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // transactions table
            `CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                request_id VARCHAR(36) REFERENCES delegation_requests(id),
                tx_hash VARCHAR(255) NOT NULL,
                tx_type VARCHAR(50),
                from_address VARCHAR(255),
                to_address VARCHAR(255),
                value VARCHAR(255),
                gas_used VARCHAR(255),
                status VARCHAR(50),
                network VARCHAR(50),
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // audit_log table
            `CREATE TABLE IF NOT EXISTS audit_log (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                action VARCHAR(100),
                request_id VARCHAR(36),
                details TEXT,
                ip_address VARCHAR(45),
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Create indexes
            `CREATE INDEX IF NOT EXISTS idx_requests_status ON delegation_requests(status)`,
            `CREATE INDEX IF NOT EXISTS idx_requests_network ON delegation_requests(network)`,
            `CREATE INDEX IF NOT EXISTS idx_requests_pubkey ON delegation_requests(pubkey)`,
            `CREATE INDEX IF NOT EXISTS idx_transactions_request ON transactions(request_id)`,
            `CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_audit_request ON audit_log(request_id)`
        ];

        for (const query of queries) {
            try {
                await this.pool.query(query);
            } catch (error) {
                console.error('Error creating table:', error);
                throw error;
            }
        }

        console.log('Database tables initialized');
    }

    // Request management
    async createRequest(data) {
        const query = `
            INSERT INTO delegation_requests (
                id, moniker, website, pubkey, signature, commission_rate,
                withdrawal_fee, operator_name, operator_email, operator_wallet,
                operator_telegram, status, network
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const values = [
            data.id,
            data.moniker,
            data.website || null,
            data.pubkey,
            data.signature,
            data.commission_rate,
            data.withdrawal_fee,
            data.operator_name,
            data.operator_email,
            data.operator_wallet,
            data.operator_telegram || null,
            'pending',
            data.network || 'mainnet'
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async getRequest(id) {
        const query = 'SELECT * FROM delegation_requests WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        return result.rows[0];
    }

    async getAllRequests(filter = {}) {
        let query = 'SELECT * FROM delegation_requests WHERE 1=1';
        const values = [];
        let paramIndex = 1;

        if (filter.status) {
            query += ` AND status = $${paramIndex}`;
            values.push(filter.status);
            paramIndex++;
        }

        if (filter.network) {
            query += ` AND network = $${paramIndex}`;
            values.push(filter.network);
            paramIndex++;
        }

        query += ' ORDER BY request_date DESC';

        const result = await this.pool.query(query, values);
        return result.rows;
    }

    async updateRequestStatus(id, status, metadata = {}) {
        const query = `
            UPDATE delegation_requests 
            SET status = $1, notes = $2, reviewer = $3, review_date = CURRENT_TIMESTAMP, 
                last_updated = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `;

        const values = [
            status,
            metadata.notes || null,
            metadata.reviewer || null,
            id
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async updateTransactionDetails(id, txData) {
        let query = 'UPDATE delegation_requests SET ';
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (txData.validator_address) {
            updates.push(`validator_address = $${paramIndex}`);
            values.push(txData.validator_address);
            paramIndex++;
        }

        if (txData.creation_tx_hash) {
            updates.push(`creation_tx_hash = $${paramIndex}`);
            values.push(txData.creation_tx_hash);
            paramIndex++;
            updates.push(`creation_tx_date = CURRENT_TIMESTAMP`);
        }

        if (txData.transfer_tx_hash) {
            updates.push(`transfer_tx_hash = $${paramIndex}`);
            values.push(txData.transfer_tx_hash);
            paramIndex++;
            updates.push(`transfer_tx_date = CURRENT_TIMESTAMP`);
        }

        updates.push('last_updated = CURRENT_TIMESTAMP');
        query += updates.join(', ');
        query += ` WHERE id = $${paramIndex} RETURNING *`;
        values.push(id);

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Transaction management
    async addTransaction(data) {
        const query = `
            INSERT INTO transactions (
                request_id, tx_hash, tx_type, from_address, to_address,
                value, gas_used, status, network
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const values = [
            data.request_id,
            data.tx_hash,
            data.tx_type || 'UNKNOWN',
            data.from_address || null,
            data.to_address || null,
            data.value || null,
            data.gas_used || null,
            data.status || 'success',
            data.network || 'mainnet'
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async getTransactions(requestId) {
        const query = 'SELECT * FROM transactions WHERE request_id = $1 ORDER BY created_date DESC';
        const result = await this.pool.query(query, [requestId]);
        return result.rows;
    }

    // Audit logging
    async addAuditLog(data) {
        const query = `
            INSERT INTO audit_log (user_id, action, request_id, details, ip_address)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const values = [
            data.user || 'system',
            data.action,
            data.request_id || null,
            data.details || null,
            data.ip_address || null
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async getAuditLogs(requestId = null) {
        let query = 'SELECT * FROM audit_log';
        const values = [];

        if (requestId) {
            query += ' WHERE request_id = $1';
            values.push(requestId);
        }

        query += ' ORDER BY created_date DESC LIMIT 100';

        const result = await this.pool.query(query, values);
        return result.rows;
    }

    // Delete request
    async deleteRequest(id) {
        const result = await this.pool.query(
            'DELETE FROM delegation_requests WHERE id = $1',
            [id]
        );
        return result.rowCount;
    }

    // Close connection
    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = new PostgresDatabase();