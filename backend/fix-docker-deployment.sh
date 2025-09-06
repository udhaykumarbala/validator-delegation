#!/bin/bash

# Script to completely fix the Docker deployment with missing columns

echo "===== FIXING DOCKER DEPLOYMENT ====="
echo ""
echo "This script will:"
echo "1. Stop all containers"
echo "2. Remove old volumes (data will be lost)"
echo "3. Rebuild images with latest code"
echo "4. Start fresh deployment"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "Step 1: Stopping containers..."
docker-compose down

echo "Step 2: Removing old volume..."
docker volume rm backend_postgres_data 2>/dev/null || echo "Volume doesn't exist or already removed"

echo "Step 3: Removing old images to force rebuild..."
docker rmi backend_backend 2>/dev/null || echo "Image doesn't exist"
docker rmi validator-backend 2>/dev/null || echo "Image doesn't exist"

echo "Step 4: Rebuilding and starting services..."
docker-compose build --no-cache backend
docker-compose up -d

echo "Step 5: Waiting for services to be ready..."
sleep 10

echo "Step 6: Verifying database schema..."
docker exec validator-postgres psql -U validator_user -d validator_db -c "\d delegation_requests" | grep -E "identity|security_contact|details"

echo ""
echo "===== DEPLOYMENT FIXED ====="
echo ""
echo "If you see identity, security_contact, and details columns above, the fix worked!"
echo "Test it by visiting: https://delegate.udhaykumarbala.dev"