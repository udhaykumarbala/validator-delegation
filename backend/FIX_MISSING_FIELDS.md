# Fix for Missing Fields (identity, security_contact, details) in Admin Panel

## Problem
The fields `identity`, `security_contact`, and `details` are showing as "N/A" in the admin panel even though they are being submitted correctly. This is because these columns are missing from the PostgreSQL database on the deployed server.

## Solution

### Option 1: Run the Node.js Fix Script (Recommended)

1. SSH into your deployed server
2. Navigate to the backend directory
3. Run the fix script:

```bash
node fix-database-columns.js
```

This script will:
- Check if you're using PostgreSQL
- Detect missing columns
- Add the missing columns automatically
- Verify the fix was applied

### Option 2: Run SQL Migration Directly

If you have direct PostgreSQL access, you can run the migration SQL:

```bash
# Connect to your PostgreSQL database
psql -U validator_user -d validator_db

# Or if using DATABASE_URL
psql $DATABASE_URL

# Then run the migration
\i migrations/add-missing-columns.sql
```

### Option 3: Manual Docker Execution

If your database is in a Docker container:

```bash
# Find your postgres container
docker ps | grep postgres

# Execute the fix script
docker exec -it <container_id> psql -U validator_user -d validator_db -c "
DO \$\$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delegation_requests' AND column_name = 'identity') THEN
        ALTER TABLE delegation_requests ADD COLUMN identity VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delegation_requests' AND column_name = 'security_contact') THEN
        ALTER TABLE delegation_requests ADD COLUMN security_contact VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delegation_requests' AND column_name = 'details') THEN
        ALTER TABLE delegation_requests ADD COLUMN details TEXT;
    END IF;
END \$\$;"
```

## Verification

After running the fix, verify it worked:

1. **Test via API**: Run the test script locally:
```bash
node test-remote-fields.js
```

2. **Check in Admin Panel**: 
   - Go to https://delegate.udhaykumarbala.dev/admin.html
   - View any request
   - The fields should now show actual values instead of "N/A"

3. **Direct Database Check** (if you have access):
```sql
\d delegation_requests
```
Should show the identity, security_contact, and details columns.

## Prevention

To prevent this in future deployments:

1. **Always use init-db.sql** for new deployments:
```bash
docker-compose up -d
# The init-db.sql file will create all columns correctly
```

2. **Check schema after deployment**:
```bash
node fix-database-columns.js
# Run this after any deployment to ensure schema is correct
```

## What This Fixes

✅ identity field will be saved and displayed  
✅ security_contact field will be saved and displayed  
✅ details field will be saved and displayed  
✅ All future submissions will store these fields correctly  
✅ Existing data is preserved (no data loss)

## Note
This only fixes the database schema. Old requests that were submitted before the fix will still show "N/A" for these fields because the data was never saved. New requests submitted after the fix will work correctly.