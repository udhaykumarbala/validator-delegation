-- Initialize PostgreSQL database for 0G Validator Delegation System

-- Create delegation_requests table
CREATE TABLE IF NOT EXISTS delegation_requests (
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
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
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
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    action VARCHAR(100),
    request_id VARCHAR(36),
    details TEXT,
    ip_address VARCHAR(45),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requests_status ON delegation_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_network ON delegation_requests(network);
CREATE INDEX IF NOT EXISTS idx_requests_pubkey ON delegation_requests(pubkey);
CREATE INDEX IF NOT EXISTS idx_requests_date ON delegation_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_transactions_request ON transactions(request_id);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_request ON audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_date);

-- Create update trigger for last_updated
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_delegation_requests_last_updated BEFORE UPDATE
    ON delegation_requests FOR EACH ROW EXECUTE PROCEDURE 
    update_last_updated_column();