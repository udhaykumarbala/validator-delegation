const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'validator_requests.db');
const db = new sqlite3.Database(dbPath);

const initialize = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create delegation requests table
            db.run(`
                CREATE TABLE IF NOT EXISTS delegation_requests (
                    id TEXT PRIMARY KEY,
                    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    
                    -- Validator Information
                    moniker TEXT NOT NULL,
                    identity TEXT,
                    website TEXT,
                    security_contact TEXT,
                    details TEXT,
                    
                    -- Technical Details
                    pubkey TEXT NOT NULL UNIQUE,
                    signature TEXT NOT NULL,
                    commission_rate REAL NOT NULL,
                    withdrawal_fee TEXT NOT NULL,
                    
                    -- Contact Information
                    operator_name TEXT NOT NULL,
                    operator_email TEXT NOT NULL,
                    operator_wallet TEXT NOT NULL,
                    operator_telegram TEXT,
                    
                    -- Request Status
                    status TEXT DEFAULT 'pending',
                    review_notes TEXT,
                    reviewed_by TEXT,
                    reviewed_date DATETIME,
                    
                    -- Transaction Details
                    validator_address TEXT,
                    creation_tx_hash TEXT,
                    creation_tx_date DATETIME,
                    transfer_tx_hash TEXT,
                    transfer_tx_date DATETIME,
                    
                    -- Network
                    network TEXT DEFAULT 'mainnet'
                )
            `, (err) => {
                if (err) reject(err);
            });
            
            // Create transactions table for tracking
            db.run(`
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    request_id TEXT NOT NULL,
                    tx_hash TEXT NOT NULL,
                    tx_type TEXT NOT NULL,
                    from_address TEXT,
                    to_address TEXT,
                    value TEXT,
                    gas_used TEXT,
                    status TEXT,
                    network TEXT,
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (request_id) REFERENCES delegation_requests(id)
                )
            `, (err) => {
                if (err) reject(err);
            });
            
            // Create admin users table
            db.run(`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT DEFAULT 'admin',
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME
                )
            `, (err) => {
                if (err) reject(err);
            });
            
            // Create audit log table
            db.run(`
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user TEXT,
                    action TEXT,
                    request_id TEXT,
                    details TEXT,
                    ip_address TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
};

// Database operations
const operations = {
    // Create new delegation request
    createRequest: (requestData) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO delegation_requests (
                    id, moniker, identity, website, security_contact, details,
                    pubkey, signature, commission_rate, withdrawal_fee,
                    operator_name, operator_email, operator_wallet, operator_telegram,
                    network
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                requestData.id,
                requestData.moniker,
                requestData.identity || null,
                requestData.website || null,
                requestData.security_contact || null,
                requestData.details || null,
                requestData.pubkey,
                requestData.signature,
                requestData.commission_rate,
                requestData.withdrawal_fee,
                requestData.operator_name,
                requestData.operator_email,
                requestData.operator_wallet,
                requestData.operator_telegram || null,
                requestData.network || 'mainnet'
            ];
            
            console.log('Inserting with params:', {
                identity: requestData.identity,
                security_contact: requestData.security_contact,
                details: requestData.details
            });
            
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },
    
    // Get all requests
    getAllRequests: (filter = {}) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM delegation_requests WHERE 1=1';
            const params = [];
            
            if (filter.status) {
                sql += ' AND status = ?';
                params.push(filter.status);
            }
            
            if (filter.network) {
                sql += ' AND network = ?';
                params.push(filter.network);
            }
            
            sql += ' ORDER BY request_date DESC';
            
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },
    
    // Get single request
    getRequest: (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM delegation_requests WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    
    // Update request status
    updateRequestStatus: (id, status, reviewData) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE delegation_requests 
                SET status = ?, review_notes = ?, reviewed_by = ?, reviewed_date = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            db.run(sql, [status, reviewData.notes, reviewData.reviewer, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },
    
    // Update transaction details
    updateTransactionDetails: (id, txData) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE delegation_requests 
                SET validator_address = ?, 
                    creation_tx_hash = ?, 
                    creation_tx_date = ?,
                    transfer_tx_hash = ?,
                    transfer_tx_date = ?
                WHERE id = ?
            `;
            
            db.run(sql, [
                txData.validator_address,
                txData.creation_tx_hash,
                txData.creation_tx_date,
                txData.transfer_tx_hash,
                txData.transfer_tx_date,
                id
            ], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },
    
    // Add transaction record
    addTransaction: (txData) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO transactions (
                    request_id, tx_hash, tx_type, from_address, to_address,
                    value, gas_used, status, network
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(sql, [
                txData.request_id,
                txData.tx_hash,
                txData.tx_type,
                txData.from_address,
                txData.to_address,
                txData.value,
                txData.gas_used,
                txData.status,
                txData.network
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },
    
    // Get transactions for a request
    getTransactions: (requestId) => {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM transactions WHERE request_id = ? ORDER BY created_date DESC',
                [requestId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    },
    
    // Add audit log entry
    addAuditLog: (logData) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO audit_log (user, action, request_id, details, ip_address)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            db.run(sql, [
                logData.user,
                logData.action,
                logData.request_id,
                logData.details,
                logData.ip_address
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },
    
    // Delete request
    deleteRequest: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM delegation_requests WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
};

module.exports = {
    initialize,
    db,
    ...operations
};