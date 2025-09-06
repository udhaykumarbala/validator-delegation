const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database-wrapper');

// Get all delegation requests
router.get('/requests', async (req, res) => {
    try {
        const { status, network } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (network) filter.network = network;
        
        const requests = await db.getAllRequests(filter);
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single request
router.get('/requests/:id', async (req, res) => {
    try {
        const request = await db.getRequest(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }
        
        const transactions = await db.getTransactions(req.params.id);
        res.json({ success: true, data: { request, transactions } });
    } catch (error) {
        console.error('Error fetching request:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new delegation request
router.post('/requests', async (req, res) => {
    try {
        const requestData = {
            id: uuidv4(),
            ...req.body,
            network: req.body.network || 'mainnet'
        };
        
        // Validate required fields
        const required = ['moniker', 'pubkey', 'signature', 'commission_rate', 
                         'withdrawal_fee', 'operator_name', 'operator_email', 'operator_wallet'];
        
        for (const field of required) {
            if (!requestData[field]) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Missing required field: ${field}` 
                });
            }
        }
        
        // Check if pubkey already exists
        const existing = await db.getAllRequests();
        const duplicate = existing.find(r => r.pubkey === requestData.pubkey);
        if (duplicate) {
            return res.status(400).json({
                success: false,
                error: 'A request with this public key already exists'
            });
        }
        
        await db.createRequest(requestData);
        
        // Add audit log
        await db.addAuditLog({
            user: requestData.operator_email,
            action: 'REQUEST_CREATED',
            request_id: requestData.id,
            details: `New delegation request from ${requestData.operator_name}`,
            ip_address: req.ip
        });
        
        res.json({ 
            success: true, 
            data: { 
                id: requestData.id,
                message: 'Request submitted successfully' 
            } 
        });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update request status (admin only)
router.put('/requests/:id/status', async (req, res) => {
    try {
        const { status, notes, reviewer } = req.body;
        
        if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid status' 
            });
        }
        
        await db.updateRequestStatus(req.params.id, status, {
            notes,
            reviewer: reviewer || 'admin'
        });
        
        // Add audit log
        await db.addAuditLog({
            user: reviewer || 'admin',
            action: 'STATUS_UPDATED',
            request_id: req.params.id,
            details: `Status changed to ${status}`,
            ip_address: req.ip
        });
        
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update transaction details
router.post('/requests/:id/transaction', async (req, res) => {
    try {
        const { validator_address, creation_tx_hash, transfer_tx_hash, tx_type } = req.body;
        
        // Update main request
        if (creation_tx_hash || transfer_tx_hash) {
            const txData = {
                validator_address,
                creation_tx_hash,
                creation_tx_date: creation_tx_hash ? new Date().toISOString() : null,
                transfer_tx_hash,
                transfer_tx_date: transfer_tx_hash ? new Date().toISOString() : null
            };
            
            await db.updateTransactionDetails(req.params.id, txData);
        }
        
        // Add transaction record
        if (req.body.tx_hash) {
            await db.addTransaction({
                request_id: req.params.id,
                tx_hash: req.body.tx_hash,
                tx_type: tx_type || 'UNKNOWN',
                from_address: req.body.from_address,
                to_address: req.body.to_address,
                value: req.body.value,
                gas_used: req.body.gas_used,
                status: req.body.status || 'success',
                network: req.body.network || 'mainnet'
            });
        }
        
        // Update status to completed if both transactions are done
        const request = await db.getRequest(req.params.id);
        if (request.creation_tx_hash && request.transfer_tx_hash) {
            await db.updateRequestStatus(req.params.id, 'completed', {
                notes: 'Validator created and ownership transferred',
                reviewer: 'system'
            });
        }
        
        // Add audit log
        await db.addAuditLog({
            user: 'admin',
            action: 'TRANSACTION_RECORDED',
            request_id: req.params.id,
            details: `Transaction recorded: ${req.body.tx_hash}`,
            ip_address: req.ip
        });
        
        res.json({ success: true, message: 'Transaction details updated' });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete request
router.delete('/requests/:id', async (req, res) => {
    try {
        const request = await db.getRequest(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }
        
        // Delete the request
        await db.deleteRequest(req.params.id);
        
        // Add audit log
        await db.addAuditLog({
            user: 'admin',
            action: 'REQUEST_DELETED',
            request_id: req.params.id,
            details: `Request ${req.params.id} deleted`,
            ip_address: req.ip
        });
        
        res.json({ success: true, message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get statistics
router.get('/stats', async (req, res) => {
    try {
        const allRequests = await db.getAllRequests();
        
        const stats = {
            total: allRequests.length,
            pending: allRequests.filter(r => r.status === 'pending').length,
            approved: allRequests.filter(r => r.status === 'approved').length,
            rejected: allRequests.filter(r => r.status === 'rejected').length,
            completed: allRequests.filter(r => r.status === 'completed').length,
            mainnet: allRequests.filter(r => r.network === 'mainnet').length,
            testnet: allRequests.filter(r => r.network === 'testnet').length,
            mock: allRequests.filter(r => r.network === 'mock').length
        };
        
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Public endpoint to get all processed validators (password protected)
router.get('/validators/processed', async (req, res) => {
    try {
        // Check access password
        const accessPassword = req.query.access_password || req.headers['x-access-password'];
        const expectedPassword = process.env.API_ACCESS_PASSWORD;
        
        if (!expectedPassword) {
            return res.status(500).json({ 
                success: false, 
                error: 'API access password not configured on server' 
            });
        }
        
        if (!accessPassword || accessPassword !== expectedPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid or missing access password' 
            });
        }
        
        // Get all completed/processed validators
        const processedRequests = await db.getAllRequests({ status: 'completed' });
        
        // For each request, get associated transactions
        const validatorsWithDetails = await Promise.all(
            processedRequests.map(async (request) => {
                const transactions = await db.getTransactions(request.id);
                
                return {
                    // Request details
                    id: request.id,
                    request_date: request.request_date,
                    network: request.network,
                    status: request.status,
                    
                    // Validator information
                    validator: {
                        moniker: request.moniker,
                        identity: request.identity,
                        website: request.website,
                        security_contact: request.security_contact,
                        details: request.details,
                        validator_address: request.validator_address
                    },
                    
                    // Technical details
                    technical: {
                        pubkey: request.pubkey,
                        signature: request.signature,
                        commission_rate: request.commission_rate,
                        withdrawal_fee: request.withdrawal_fee
                    },
                    
                    // Operator information
                    operator: {
                        name: request.operator_name,
                        email: request.operator_email,
                        wallet: request.operator_wallet,
                        telegram: request.operator_telegram
                    },
                    
                    // Transaction history
                    transactions: {
                        creation_tx: {
                            hash: request.creation_tx_hash,
                            date: request.creation_tx_date
                        },
                        transfer_tx: {
                            hash: request.transfer_tx_hash,
                            date: request.transfer_tx_date
                        },
                        all_transactions: transactions.map(tx => ({
                            hash: tx.tx_hash,
                            type: tx.tx_type,
                            from: tx.from_address,
                            to: tx.to_address,
                            value: tx.value,
                            gas_used: tx.gas_used,
                            status: tx.status,
                            date: tx.created_date
                        }))
                    },
                    
                    // Processing metadata
                    processing: {
                        reviewer: request.reviewer,
                        review_date: request.review_date,
                        notes: request.notes,
                        last_updated: request.last_updated
                    }
                };
            })
        );
        
        res.json({ 
            success: true, 
            count: validatorsWithDetails.length,
            data: validatorsWithDetails 
        });
        
    } catch (error) {
        console.error('Error fetching processed validators:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;