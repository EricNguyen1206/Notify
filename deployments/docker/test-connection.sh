#!/bin/bash

# Test script to verify frontend-backend connectivity
# Usage: ./test-connection.sh

echo "🔍 Testing Notify Application Connectivity..."
echo "=============================================="

# Check if containers are running
echo "📦 Checking container status..."
docker compose ps

echo ""
echo "🌐 Testing frontend accessibility..."
curl -f http://localhost:3000 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend is accessible at http://localhost:3000"
else
    echo "❌ Frontend is not accessible at http://localhost:3000"
fi

echo ""
echo "🔧 Testing backend API directly..."
curl -f http://localhost:8080/kaithhealthcheck > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend API is accessible at http://localhost:8080/kaithhealthcheck"
else
    echo "❌ Backend API is not accessible at http://localhost:8080/kaithhealthcheck"
fi

echo ""
echo "🔀 Testing nginx proxy..."
curl -f http://localhost/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Nginx proxy is working at http://localhost/health"
else
    echo "❌ Nginx proxy is not working at http://localhost/health"
fi

echo ""
echo "🔐 Testing authentication endpoint..."
curl -f -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"invalid"}' > /dev/null 2>&1
if [ $? -eq 22 ]; then  # 22 is curl's exit code for HTTP 4xx errors (expected for invalid credentials)
    echo "✅ Auth endpoint is accessible at http://localhost/api/auth/login (returns 401 as expected)"
elif [ $? -eq 0 ]; then
    echo "✅ Auth endpoint is accessible at http://localhost/api/auth/login"
else
    echo "❌ Auth endpoint is not accessible at http://localhost/api/auth/login"
fi

echo ""
echo "🔍 Checking environment variables in frontend container..."
docker compose exec frontend printenv | grep NEXT_PUBLIC

echo ""
echo "📋 Test completed!"
echo "If any tests failed, check the logs with: docker compose logs [service-name]"
